const connectDB = require('../config/db');

// Utility: convert HH:MM to total minutes
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Returns all booked times across mediation, conciliation, arbitration for a given date
async function getBookedTimesForDate(connection, date) {
  const [mediationSchedules] = await connection.execute(
    'SELECT time FROM mediation WHERE date = ? AND is_deleted = FALSE',
    [date]
  );
  const [conciliationSchedules] = await connection.execute(
    'SELECT time FROM conciliation WHERE date = ?',
    [date]
  );
  const [arbitrationSchedules] = await connection.execute(
    'SELECT time FROM arbitration WHERE date = ? AND is_deleted = FALSE',
    [date]
  );

  const mediationTimes = mediationSchedules.map(r => r.time);
  const conciliationTimes = conciliationSchedules.map(r => r.time);
  const arbitrationTimes = arbitrationSchedules.map(r => r.time);
  const all = [...mediationTimes, ...conciliationTimes, ...arbitrationTimes];
  return [...new Set(all)];
}

// Compute available slots meta for a date
async function getAvailableSlotsDetails(connection, date) {
  const allTimeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];
  const bookedTimes = await getBookedTimesForDate(connection, date);
  const availableTimes = allTimeSlots.filter(t => !bookedTimes.includes(t));
  const usedSlots = bookedTimes.length;
  const maxSlotsPerDay = 4;
  const isFull = usedSlots >= maxSlotsPerDay;
  return { availableTimes, bookedTimes, usedSlots, maxSlotsPerDay, isFull };
}

// Create or update mediation schedule with validations
async function setMediationScheduleDb(connection, { complaint_id, date, time }) {
  // Fetch schedules for the day
  const [existingSchedules] = await connection.execute(
    'SELECT id, complaint_id, time FROM mediation WHERE date = ? AND is_deleted = FALSE',
    [date]
  );

  // Max 4 sessions/day across mediation only (cross-system limit handled via UI + getAvailable)
  if (existingSchedules.length >= 4) {
    throw new Error('Maximum 4 mediation sessions allowed per day. Please choose a different date.');
  }

  const selectedTimeMinutes = timeToMinutes(time);
  for (const schedule of existingSchedules) {
    if (schedule.complaint_id === complaint_id) continue;
    const existingTimeMinutes = timeToMinutes(schedule.time);
    const diff = Math.abs(selectedTimeMinutes - existingTimeMinutes);
    if (diff === 0) {
      throw new Error('This time slot is already booked. Please choose a different time.');
    }
    if (diff < 60) {
      throw new Error('Minimum 1-hour interval required between mediation sessions. Please choose a different time.');
    }
  }

  // Upsert mediation row
  const [existing] = await connection.execute(
    'SELECT id FROM mediation WHERE complaint_id = ? AND is_deleted = FALSE',
    [complaint_id]
  );
  if (existing.length > 0) {
    await connection.execute(
      'UPDATE mediation SET date = ?, time = ? WHERE complaint_id = ? AND is_deleted = FALSE',
      [date, time, complaint_id]
    );
  } else {
    await connection.execute(
      'INSERT INTO mediation (complaint_id, date, time) VALUES (?, ?, ?)',
      [complaint_id, date, time]
    );
  }

  // Clear conciliation (same complaint) and soft-delete arbitration to free slot
  await connection.execute('DELETE FROM conciliation WHERE complaint_id = ?', [complaint_id]);
  await connection.execute('UPDATE arbitration SET is_deleted = TRUE WHERE complaint_id = ? AND is_deleted = FALSE', [complaint_id]);

  // Update complaint status
  await connection.execute('UPDATE complaints SET status = ? WHERE id = ?', ['Mediation', complaint_id]);

  return true;
}

// Return mediations with joined complaint and party display names
async function listAllMediationsDetailed(connection) {
  const [mediations] = await connection.execute(`
    SELECT m.id, m.complaint_id, to_char(m.date, 'YYYY-MM-DD') as date, m.time, m.created_at,
           c.case_title, c.status,
           TRIM(CONCAT(UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
             CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END)) AS complainant,
           TRIM(CONCAT(UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
             CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END)) AS respondent,
           TRIM(CONCAT(UPPER(COALESCE(wit.lastname,'')), ', ', UPPER(COALESCE(wit.firstname,'')),
             CASE WHEN COALESCE(wit.middlename,'') <> '' THEN CONCAT(' ', UPPER(wit.middlename)) ELSE '' END)) AS witness
    FROM mediation m
    LEFT JOIN complaints c ON m.complaint_id = c.id
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    WHERE m.is_deleted = FALSE
    ORDER BY m.date DESC, m.time ASC
  `);
  return mediations;
}

// Save mediation session with reschedule-based architecture
async function saveMediationSessionDb(connection, { mediation_id, minutes, files = [] }) {
  // Get current mediation date and time
  const [mediation] = await connection.execute(
    'SELECT date, time FROM mediation WHERE id = ?',
    [mediation_id]
  );
  
  if (mediation.length === 0) {
    throw new Error('Mediation not found');
  }
  
  const { date, time } = mediation[0];
  
  // Insert documentation files first and collect their IDs
  const documentationIds = [];
  for (const file of files) {
    if (file && file.filename) {
      const cleanPath = `uploads/mediation/${file.filename}`;
      
      const [rows] = await connection.execute(
        'INSERT INTO mediation_documentation (mediation_id, file_path) VALUES (?, ?) RETURNING id',
        [mediation_id, cleanPath]
      );
      
      const newId = Array.isArray(rows) && rows.length > 0 ? rows[0].id : null;
      if (newId) {
        documentationIds.push(newId);
      }
    }
  }
  
  // Convert documentation IDs to JSON string for storage
  const cleanedDocumentationIds = documentationIds.filter(id => id !== null && id !== undefined);
  const documentationIdsJson = JSON.stringify(cleanedDocumentationIds);
  
  // Check if reschedule record exists for current date/time
  const [existingReschedule] = await connection.execute(
    'SELECT id FROM mediation_reschedule WHERE mediation_id = ? AND reschedule_date = ? AND reschedule_time = ?',
    [mediation_id, date, time]
  );
  
  if (existingReschedule.length > 0) {
    // Update existing reschedule record with minutes and documentation IDs
    await connection.execute(
      'UPDATE mediation_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
      [minutes, documentationIdsJson, existingReschedule[0].id]
    );
    return existingReschedule[0].id;
  } else {
    // Create new reschedule record for current session with documentation IDs
    const [result] = await connection.execute(
      'INSERT INTO mediation_reschedule (mediation_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [mediation_id, date, time, minutes, 'Initial session', documentationIdsJson]
    );
    return result[0].id;
  }
}

// Soft-delete a mediation (mark is_deleted = 1)
async function softDeleteMediationDb(connection, mediation_id) {
  await connection.execute('UPDATE mediation SET is_deleted = TRUE WHERE id = ?', [mediation_id]);
  return true;
}

// Reschedule mediation and write reschedule history
async function rescheduleMediationDb(connection, { mediation_id, reschedule_date, reschedule_time, reason }) {
  const [rows] = await connection.execute('SELECT complaint_id FROM mediation WHERE id = ?', [mediation_id]);
  if (rows.length === 0) {
    throw new Error('Mediation not found');
  }
  await connection.execute(
    'INSERT INTO mediation_reschedule (mediation_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
    [mediation_id, reschedule_date, reschedule_time, reason]
  );
  await connection.execute('UPDATE mediation SET date = ?, time = ? WHERE id = ?', [reschedule_date, reschedule_time, mediation_id]);
  return rows[0].complaint_id; // For notifications
}

module.exports = {
  getAvailableSlotsDetails,
  setMediationScheduleDb,
  listAllMediationsDetailed,
  saveMediationSessionDb,
  softDeleteMediationDb,
  rescheduleMediationDb,
};
