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
  const [mediation] = await connection.execute(
    'SELECT complaint_id, time FROM mediation WHERE date = ? AND is_deleted = 0',
    [date]
  );
  const [conciliation] = await connection.execute(
    'SELECT id, complaint_id, time FROM conciliation WHERE date = ?',
    [date]
  );
  return { mediation, conciliation };
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
           DATE_FORMAT(con.date, '%Y-%m-%d') AS date,
           con.time, con.created_at, c.case_title, c.status,
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

async function saveConciliationSessionDb(connection, { conciliation_id, minutes, files = [] }) {
  if (minutes && minutes.trim()) {
    await connection.execute('UPDATE conciliation SET minutes = ? WHERE id = ?', [minutes, conciliation_id]);
  }
  for (const filePath of files) {
    await connection.execute(
      'INSERT INTO conciliation_documentation (conciliation_id, file_path) VALUES (?, ?)',
      [conciliation_id, filePath]
    );
  }
  return true;
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

async function getAvailableSlotsDetails(connection, date, excludeConciliationId = null) {
  const { mediation, conciliation } = await getCombinedSchedulesForDate(connection, date);
  const mediationTimes = mediation.map(s => s.time);
  const filteredConciliation = excludeConciliationId
    ? conciliation.filter(s => String(s.id) !== String(excludeConciliationId))
    : conciliation;
  const conciliationTimes = filteredConciliation.map(s => s.time);

  const allTimeSlots = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00'];
  const allBookedTimes = [...mediationTimes, ...conciliationTimes];
  const bookedTimes = [...new Set(allBookedTimes)];
  const availableSlots = allTimeSlots.filter(t => !bookedTimes.includes(t));
  const usedSlots = bookedTimes.length;
  const maxSlotsPerDay = 4;
  const isFull = usedSlots >= maxSlotsPerDay;

  // actualUsedSlots without exclusion for display purposes
  let actualUsedSlots = usedSlots;
  if (excludeConciliationId) {
    const actualBookedTimes = [...new Set([...mediationTimes, ...conciliation.map(s => s.time)])];
    actualUsedSlots = actualBookedTimes.length;
  }
  return { availableSlotsLen: availableSlots.length, usedSlots, actualUsedSlots, maxSlotsPerDay, bookedTimes, isFull };
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
