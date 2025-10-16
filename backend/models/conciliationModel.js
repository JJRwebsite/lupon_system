const connectDB = require('../config/db');

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Build conciliation schedules for a specific user (similar to mediation user schedules)
async function listUserConciliationSchedulesDetailed(connection, userId) {
  // Get all complaints for this user
  const [complaints] = await connection.execute('SELECT * FROM complaints WHERE user_id = ?', [userId]);
  let schedules = [];
  for (const complaint of complaints) {
    const [conciliations] = await connection.execute('SELECT * FROM conciliation WHERE complaint_id = ?', [complaint.id]);
    for (const con of conciliations) {
      schedules.push({
        id: con.id,
        case_no: complaint.id,
        case_title: complaint.case_title,
        case_description: complaint.case_description,
        nature_of_case: complaint.nature_of_case,
        relief_description: complaint.relief_description,
        date_filed: complaint.date_filed,
        complainant: '',
        respondent: '',
        schedule_date: con.date,
        schedule_time: con.time,
        case_status: complaint.status,
      });
    }
  }
  // Fetch names for each schedule (complainant/respondent)
  for (let sched of schedules) {
    const [row] = await connection.execute(`
      SELECT 
        TRIM(CONCAT(
          UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
          CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
        )) AS complainant_name,
        TRIM(CONCAT(
          UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
          CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
        )) AS respondent_name
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      WHERE c.id = ?
    `, [sched.case_no]);
    if (row.length > 0) {
      sched.complainant = row[0].complainant_name || '';
      sched.respondent = row[0].respondent_name || '';
    }
  }
  return schedules;
}

async function getCombinedSchedulesForDate(connection, date) {
  // Get mediation schedules (main table only for now)
  const [mediation] = await connection.execute(
    'SELECT complaint_id, time FROM mediation WHERE date = ? AND is_deleted = FALSE',
    [date]
  );
  
  // Get conciliation schedules from main table
  const [conciliation] = await connection.execute(
    'SELECT id, complaint_id, time FROM conciliation WHERE date = ?',
    [date]
  );
  
  // Get conciliation reschedule sessions for the same date
  const [conciliationReschedules] = await connection.execute(
    'SELECT conciliation_id as id, conciliation_id as complaint_id, reschedule_time as time FROM conciliation_reschedule WHERE reschedule_date = ?',
    [date]
  );
  
  // Get mediation reschedule sessions for the same date
  const [mediationReschedules] = await connection.execute(
    'SELECT mediation_id as id, mediation_id as complaint_id, reschedule_time as time FROM mediation_reschedule WHERE reschedule_date = ?',
    [date]
  );
  
  // Combine all schedules
  const allMediationSchedules = [...mediation, ...mediationReschedules];
  const allConciliationSchedules = [...conciliation, ...conciliationReschedules];
  
  return { mediation: allMediationSchedules, conciliation: allConciliationSchedules };
}

// Create/update conciliation schedule with combined (mediation+conciliation) validations
async function setConciliationScheduleDb(connection, { complaint_id, date, time, panel = [] }) {
  const { mediation, conciliation } = await getCombinedSchedulesForDate(connection, date);
  const allExisting = [
    ...mediation.map(s => ({ complaint_id: s.complaint_id, time: s.time, type: 'mediation' })),
    ...conciliation.map(s => ({ complaint_id: s.complaint_id, time: s.time, type: 'conciliation' })),
  ];

  if (allExisting.length >= 4) {
    throw new Error('Maximum 4 sessions allowed per day (mediation + conciliation combined). Please choose a different date.');
  }

  const selected = timeToMinutes(time);
  for (const s of allExisting) {
    if (s.complaint_id === complaint_id && s.type === 'conciliation') continue;
    const diff = Math.abs(selected - timeToMinutes(s.time));
    if (diff === 0) {
      throw new Error(`This time slot is already booked by a ${s.type} session. Please choose a different time.`);
    }
    if (diff < 60) {
      throw new Error(`Minimum 1-hour interval required between sessions. There is a ${s.type} session too close to this time. Please choose a different time.`);
    }
  }

  const [existing] = await connection.execute(
    'SELECT id FROM conciliation WHERE complaint_id = ?',[complaint_id]
  );
  if (existing.length > 0) {
    await connection.execute(
      'UPDATE conciliation SET date = ?, time = ?, lupon_panel = ? WHERE complaint_id = ?',
      [date, time, JSON.stringify(panel || []), complaint_id]
    );
  } else {
    await connection.execute(
      'INSERT INTO conciliation (complaint_id, date, time, lupon_panel) VALUES (?, ?, ?, ?)',
      [complaint_id, date, time, JSON.stringify(panel || [])]
    );
  }

  // Clear any mediation for this complaint to free slot
  await connection.execute('DELETE FROM mediation WHERE complaint_id = ?', [complaint_id]);
  // Update complaint status
  await connection.execute('UPDATE complaints SET status = ? WHERE id = ?', ['Conciliation', complaint_id]);

  return true;
}

// Return conciliation list basic info; controller may enrich further
async function listAllConciliationsBasic(connection) {
  const [rows] = await connection.execute(`
    SELECT con.id, con.complaint_id,
           to_char(con.date, 'YYYY-MM-DD') AS date,
           con.time, con.created_at, con.minutes, con.lupon_panel, c.case_title, c.status,
           TRIM(CONCAT(UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
             CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END)) AS complainant,
           TRIM(CONCAT(UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
             CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END)) AS respondent,
           TRIM(CONCAT(UPPER(COALESCE(wit.lastname,'')), ', ', UPPER(COALESCE(wit.firstname,'')),
             CASE WHEN COALESCE(wit.middlename,'') <> '' THEN CONCAT(' ', UPPER(wit.middlename)) ELSE '' END)) AS witness,
           wit.purok AS witness_purok, wit.contact AS witness_contact, wit.barangay AS witness_barangay
    FROM conciliation con
    JOIN complaints c ON con.complaint_id = c.id
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    ORDER BY con.id DESC
  `);
  return rows;
}

// Save conciliation session with reschedule-based architecture
async function saveConciliationSessionDb(connection, { conciliation_id, minutes, files = [] }) {
  // Insert documentation files first and collect their IDs
  const documentationIds = [];
  for (const file of files) {
    if (file && file.filename) {
      const cleanPath = `uploads/conciliation/${file.filename}`;
      
      const [rows] = await connection.execute(
        'INSERT INTO conciliation_documentation (conciliation_id, file_path) VALUES (?, ?) RETURNING id',
        [conciliation_id, cleanPath]
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
  
  // Find the most recent reschedule session for this conciliation
  // This ensures we save to the current active session (e.g., "Reschedule #1") not the initial session
  const [latestReschedule] = await connection.execute(
    'SELECT id, reschedule_date, reschedule_time FROM conciliation_reschedule WHERE conciliation_id = ? ORDER BY created_at DESC LIMIT 1',
    [conciliation_id]
  );
  
  if (latestReschedule.length > 0) {
    // Update the most recent reschedule session with minutes and documentation IDs
    await connection.execute(
      'UPDATE conciliation_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
      [minutes, documentationIdsJson, latestReschedule[0].id]
    );
    return latestReschedule[0].id;
  } else {
    // No reschedule sessions exist, get main conciliation date/time and create initial session
    const [conciliation] = await connection.execute(
      'SELECT date, time FROM conciliation WHERE id = ?',
      [conciliation_id]
    );
    
    if (conciliation.length === 0) {
      throw new Error('Conciliation not found');
    }
    
    const { date, time } = conciliation[0];
    
    // Create new reschedule record for initial session with documentation IDs
    const [result] = await connection.execute(
      'INSERT INTO conciliation_reschedule (conciliation_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [conciliation_id, date, time, minutes, 'Initial session', documentationIdsJson]
    );
    return result[0].id;
  }
}

async function softDeleteConciliationDb(connection, conciliation_id) {
  // Hard delete as per current implementation
  await connection.execute('DELETE FROM conciliation WHERE id = ?', [conciliation_id]);
  return true;
}

async function rescheduleConciliationDb(connection, { conciliation_id, reschedule_date, reschedule_time, reason }) {
  const [rows] = await connection.execute('SELECT complaint_id FROM conciliation WHERE id = ?', [conciliation_id]);
  if (rows.length === 0) throw new Error('Conciliation not found');
  const complaint_id = rows[0].complaint_id;
  await connection.execute(
    'INSERT INTO conciliation_reschedule (conciliation_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
    [conciliation_id, reschedule_date, reschedule_time, reason]
  );
  await connection.execute('UPDATE conciliation SET date = ?, time = ? WHERE id = ?', [reschedule_date, reschedule_time, conciliation_id]);
  return complaint_id;
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

module.exports = {
  setConciliationScheduleDb,
  listAllConciliationsBasic,
  listUserConciliationSchedulesDetailed,
  saveConciliationSessionDb,
  softDeleteConciliationDb,
  rescheduleConciliationDb,
  getAvailableSlotsDetails,
};
