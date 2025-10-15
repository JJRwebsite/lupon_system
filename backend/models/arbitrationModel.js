const connectDB = require('../config/db');

// Upsert arbitration schedule and update related modules/status
async function setArbitrationScheduleDb(connection, { complaint_id, date, time, panel_members = [] }) {
  const panelJson = panel_members ? JSON.stringify(panel_members) : null;
  const [existing] = await connection.execute(
    'SELECT id FROM arbitration WHERE complaint_id = ? AND is_deleted = 0',
    [complaint_id]
  );
  if (existing.length > 0) {
    await connection.execute(
      'UPDATE arbitration SET date = ?, time = ?, panel_members = ? WHERE complaint_id = ? AND is_deleted = 0',
      [date, time, panelJson, complaint_id]
    );
  } else {
    await connection.execute(
      'INSERT INTO arbitration (complaint_id, date, time, panel_members) VALUES (?, ?, ?, ?)',
      [complaint_id, date, time, panelJson]
    );
  }
  // Clear mediation (soft delete) and conciliation (hard delete)
  await connection.execute('UPDATE mediation SET is_deleted = 1 WHERE complaint_id = ? AND is_deleted = 0', [complaint_id]);
  await connection.execute('DELETE FROM conciliation WHERE complaint_id = ?', [complaint_id]);
  // Update complaint status
  await connection.execute('UPDATE complaints SET status = ? WHERE id = ?', ['Arbitration', complaint_id]);
  return true;
}

// List arbitrations with joined party display names
async function listAllArbitrationsDetailed(connection) {
  const [rows] = await connection.execute(`
    SELECT a.id, a.complaint_id, a.date, a.time, a.created_at, a.panel_members, c.case_title,
           c.status,
           TRIM(CONCAT(UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
             CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END)) AS complainant,
           TRIM(CONCAT(UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
             CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END)) AS respondent
    FROM arbitration a
    JOIN complaints c ON a.complaint_id = c.id
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    WHERE a.is_deleted = 0
    ORDER BY a.id DESC
  `);
  return rows;
}

// Save arbitration session minutes + documentation, and upsert reschedule record for current date/time
async function saveArbitrationSessionDb(connection, { arbitration_id, date, time, minutes, files = [] }) {
  // Insert docs and collect IDs
  let documentationIds = [];
  for (const filePath of files) {
    const [docRes] = await connection.execute(
      'INSERT INTO arbitration_documentation (arbitration_id, file_path) VALUES (?, ?)',
      [arbitration_id, filePath]
    );
    documentationIds.push(docRes.insertId);
  }
  const documentationIdsJson = documentationIds.length ? JSON.stringify(documentationIds) : null;

  // Upsert reschedule record for this date/time
  const [existingReschedule] = await connection.execute(
    'SELECT id FROM arbitration_reschedule WHERE arbitration_id = ? AND reschedule_date = ? AND reschedule_time = ?',
    [arbitration_id, date, time]
  );
  if (existingReschedule.length > 0) {
    await connection.execute(
      'UPDATE arbitration_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
      [minutes, documentationIdsJson, existingReschedule[0].id]
    );
  } else {
    await connection.execute(
      'INSERT INTO arbitration_reschedule (arbitration_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?)',
      [arbitration_id, date, time, minutes || null, 'Initial session', documentationIdsJson]
    );
  }
  return true;
}

// Soft delete a specific reschedule row
async function softDeleteArbitrationRescheduleDb(connection, id) {
  await connection.execute('DELETE FROM arbitration_reschedule WHERE id = ?', [id]);
  return true;
}

// Reschedule arbitration and return complaint_id for notifications
async function rescheduleArbitrationDb(connection, { arbitration_id, reschedule_date, reschedule_time, reason }) {
  await connection.execute(
    'INSERT INTO arbitration_reschedule (arbitration_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
    [arbitration_id, reschedule_date, reschedule_time, reason]
  );
  await connection.execute('UPDATE arbitration SET date = ?, time = ? WHERE id = ?', [reschedule_date, reschedule_time, arbitration_id]);
  const [arbitration] = await connection.execute('SELECT complaint_id FROM arbitration WHERE id = ?', [arbitration_id]);
  return arbitration.length > 0 ? arbitration[0].complaint_id : null;
}

// Get arbitration data (with reschedules) by case
async function getArbitrationByCaseDetailed(connection, complaint_id) {
  const [arbitrations] = await connection.execute(
    'SELECT * FROM arbitration WHERE complaint_id = ? AND is_deleted = 0',
    [complaint_id]
  );
  for (let arb of arbitrations) {
    const [reschedules] = await connection.execute(
      'SELECT * FROM arbitration_reschedule WHERE arbitration_id = ? ORDER BY id ASC',
      [arb.id]
    );
    arb.reschedules = reschedules;
  }
  return arbitrations;
}

module.exports = {
  setArbitrationScheduleDb,
  listAllArbitrationsDetailed,
  saveArbitrationSessionDb,
  softDeleteArbitrationRescheduleDb,
  rescheduleArbitrationDb,
  getArbitrationByCaseDetailed,
};
