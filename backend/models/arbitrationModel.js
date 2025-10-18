const connectDB = require('../config/db');

// Upsert arbitration schedule and update related modules/status
async function setArbitrationScheduleDb(connection, { complaint_id, date, time, panel_members = [] }) {
  const panelJson = panel_members ? JSON.stringify(panel_members) : null;
  const [existing] = await connection.execute(
    'SELECT id FROM arbitration WHERE complaint_id = ? AND is_deleted = false',
    [complaint_id]
  );
  if (existing.length > 0) {
    await connection.execute(
      'UPDATE arbitration SET date = ?, time = ?, panel_members = ? WHERE complaint_id = ? AND is_deleted = false',
      [date, time, panelJson, complaint_id]
    );
  } else {
    await connection.execute(
      'INSERT INTO arbitration (complaint_id, date, time, panel_members) VALUES (?, ?, ?, ?)',
      [complaint_id, date, time, panelJson]
    );
  }
  // Clear mediation (soft delete) and conciliation (hard delete)
  await connection.execute('UPDATE mediation SET is_deleted = true WHERE complaint_id = ? AND is_deleted = false', [complaint_id]);
  await connection.execute('DELETE FROM conciliation WHERE complaint_id = ?', [complaint_id]);
  // Update complaint status
  await connection.execute('UPDATE complaints SET status = ? WHERE id = ?', ['Arbitration', complaint_id]);
  return true;
}

// List arbitrations with joined party display names and reschedule data (like mediation/conciliation)
async function listAllArbitrationsDetailed(connection) {
  try {
    console.log('🔍 listAllArbitrationsDetailed - Starting query');
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
      WHERE a.is_deleted = false
      ORDER BY a.id DESC
    `);
    console.log('✅ listAllArbitrationsDetailed - Query successful, found rows:', rows.length);
    
    // Process each arbitration
    for (let arbitration of rows) {
      // Parse panel_members if it exists and is a string
      if (arbitration.panel_members) {
        try {
          arbitration.panel_members = typeof arbitration.panel_members === 'string' 
            ? JSON.parse(arbitration.panel_members)
            : arbitration.panel_members;
          
          // Ensure panel_members is an array
          if (!Array.isArray(arbitration.panel_members)) {
            console.warn('panel_members is not an array for arbitration ID:', arbitration.id);
            arbitration.panel_members = [];
          }
        } catch (e) {
          console.error('Error parsing panel_members for arbitration ID:', arbitration.id, e);
          arbitration.panel_members = [];
        }
      } else {
        arbitration.panel_members = [];
      }
      const [reschedules] = await connection.execute(`
        SELECT ar.id, ar.reschedule_date, ar.reschedule_time, ar.minutes, ar.reason, ar.documentation_id, ar.created_at,
               STRING_AGG(DISTINCT ad.file_path, ',') as documentation_files
        FROM arbitration_reschedule ar
        LEFT JOIN arbitration_documentation ad ON ad.id = ANY(
          CASE 
            WHEN ar.documentation_id IS NULL OR ar.documentation_id = '' THEN ARRAY[]::integer[]
            ELSE ARRAY(SELECT jsonb_array_elements_text(ar.documentation_id::jsonb)::integer)
          END
        )
        WHERE ar.arbitration_id = $1
        GROUP BY ar.id, ar.reschedule_date, ar.reschedule_time, ar.minutes, ar.reason, ar.documentation_id, ar.created_at
        ORDER BY ar.created_at ASC
      `, [arbitration.id]);
      
      // Process reschedules to include documentation arrays (return file paths as strings like mediation/conciliation)
      arbitration.reschedules = reschedules.map(r => ({
        ...r,
        documentation: r.documentation_files ? r.documentation_files.split(',').filter(file => file.trim()) : []
      }));
    }
    
    return rows || [];
  } catch (error) {
    console.error('❌ listAllArbitrationsDetailed - SQL Error:', error.message);
    console.error('❌ Full error:', error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Save arbitration session minutes + documentation, and upsert reschedule record for current date/time
async function saveArbitrationSessionDb(connection, { arbitration_id, date, time, minutes, files = [] }) {
  console.log('🔍 saveArbitrationSessionDb - Starting with:', { arbitration_id, date, time, minutes, filesCount: files.length });
  
  // Insert docs and collect IDs
  let documentationIds = [];
  for (const filePath of files) {
    console.log('📁 saveArbitrationSessionDb - Inserting file:', filePath);
    const [result] = await connection.execute(
      'INSERT INTO arbitration_documentation (arbitration_id, file_path) VALUES (?, ?) RETURNING id',
      [arbitration_id, filePath]
    );
    const insertId = result[0].id;
    console.log('✅ saveArbitrationSessionDb - File inserted with ID:', insertId);
    documentationIds.push(insertId);
  }
  
  const documentationIdsJson = documentationIds.length ? JSON.stringify(documentationIds) : '[]';
  console.log('📋 saveArbitrationSessionDb - Documentation IDs JSON:', documentationIdsJson);

  // Find the most recent reschedule session for this arbitration (like mediation/conciliation)
  const [existingReschedules] = await connection.execute(
    'SELECT id FROM arbitration_reschedule WHERE arbitration_id = ? ORDER BY created_at DESC LIMIT 1',
    [arbitration_id]
  );
  
  let rescheduleId;
  if (existingReschedules.length > 0) {
    // Update the most recent reschedule session
    rescheduleId = existingReschedules[0].id;
    console.log('🔄 saveArbitrationSessionDb - Updating existing reschedule:', rescheduleId);
    await connection.execute(
      'UPDATE arbitration_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
      [minutes, documentationIdsJson, rescheduleId]
    );
  } else {
    // Create initial reschedule session
    console.log('➕ saveArbitrationSessionDb - Creating new reschedule session');
    const [result] = await connection.execute(
      'INSERT INTO arbitration_reschedule (arbitration_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [arbitration_id, date, time, minutes || null, 'Initial session', documentationIdsJson]
    );
    rescheduleId = result[0].id;
  }
  
  console.log('✅ saveArbitrationSessionDb - Session saved successfully, reschedule ID:', rescheduleId);
  return rescheduleId;
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
    'SELECT * FROM arbitration WHERE complaint_id = ? AND is_deleted = false',
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
