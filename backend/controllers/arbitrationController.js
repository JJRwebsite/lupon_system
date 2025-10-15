const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');

exports.setArbitrationSchedule = async (req, res) => {
  console.log('🔍 setArbitrationSchedule - Received body:', req.body);
  const { complaint_id, date, time, panel_members } = req.body;
  console.log('🔍 setArbitrationSchedule - Parsed values:', { complaint_id, date, time, panel_members });
  
  const connection = await connectDB();
  try {
    // Convert panel_members array to JSON string for storage
    const panelMembersJson = panel_members ? JSON.stringify(panel_members) : null;
    console.log('🔍 setArbitrationSchedule - Panel members JSON:', panelMembersJson);
    
    // Check if arbitration already exists for this complaint
    const [existing] = await connection.execute(
      'SELECT id FROM arbitration WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );

    if (existing.length > 0) {
      // Update existing arbitration
      await connection.execute(
        'UPDATE arbitration SET date = ?, time = ?, panel_members = ? WHERE complaint_id = ? AND is_deleted = 0',
        [date, time, panelMembersJson, complaint_id]
      );
    } else {
      // Create new arbitration
      await connection.execute(
        'INSERT INTO arbitration (complaint_id, date, time, panel_members) VALUES (?, ?, ?, ?)',
        [complaint_id, date, time, panelMembersJson]
      );
    }
    
    // Clear any existing mediation and conciliation schedules for this complaint to free up time slots
    // This prevents old time slots from being counted as "booked" when moved to arbitration
    await connection.execute(
      'UPDATE mediation SET is_deleted = 1 WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );
    
    // Delete conciliation record since conciliation table doesn't have is_deleted column
    await connection.execute(
      'DELETE FROM conciliation WHERE complaint_id = ?',
      [complaint_id]
    );
    
    // Update complaint status to 'Arbitration'
    await connection.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      ['Arbitration', complaint_id]
    );
    
    // Create notification for users
    await notifyUsersAboutCase(complaint_id, 'arbitration_scheduled');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in setArbitrationSchedule:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all arbitration schedules with joined complaint, complainant, and respondent info
exports.getAllArbitrations = async (req, res) => {
  const connection = await connectDB();
  try {
    const [arbitrations] = await connection.execute(
      `SELECT a.id, a.complaint_id, a.date, a.time, a.created_at, a.panel_members, c.case_title,
        c.status,
        CASE 
          WHEN complainant_res.lastname IS NOT NULL AND complainant_res.firstname IS NOT NULL THEN 
            CONCAT(UPPER(complainant_res.lastname), ', ', UPPER(complainant_res.firstname), 
                   CASE WHEN complainant_res.middlename IS NOT NULL AND complainant_res.middlename != '' 
                        THEN CONCAT(' ', UPPER(complainant_res.middlename)) 
                        ELSE '' END)
          WHEN complainant_res.lastname IS NOT NULL THEN UPPER(complainant_res.lastname)
          WHEN complainant_res.firstname IS NOT NULL THEN UPPER(complainant_res.firstname)
          WHEN complainant_res.id IS NOT NULL THEN CONCAT('RESIDENT #', complainant_res.id)
          ELSE 'UNKNOWN COMPLAINANT'
        END AS complainant,
        CASE 
          WHEN respondent_res.lastname IS NOT NULL AND respondent_res.firstname IS NOT NULL THEN 
            CONCAT(UPPER(respondent_res.lastname), ', ', UPPER(respondent_res.firstname), 
                   CASE WHEN respondent_res.middlename IS NOT NULL AND respondent_res.middlename != '' 
                        THEN CONCAT(' ', UPPER(respondent_res.middlename)) 
                        ELSE '' END)
          WHEN respondent_res.lastname IS NOT NULL THEN UPPER(respondent_res.lastname)
          WHEN respondent_res.firstname IS NOT NULL THEN UPPER(respondent_res.firstname)
          WHEN respondent_res.id IS NOT NULL THEN CONCAT('RESIDENT #', respondent_res.id)
          ELSE 'UNKNOWN RESPONDENT'
        END AS respondent
      FROM arbitration a
      JOIN complaints c ON a.complaint_id = c.id
      LEFT JOIN residents complainant_res ON c.complainant_id = complainant_res.id
      LEFT JOIN residents respondent_res ON c.respondent_id = respondent_res.id
      WHERE a.is_deleted = 0 AND c.status = 'Arbitration'
      ORDER BY a.id DESC`
    );
    
    // Fetch reschedules and their specific documentation for each arbitration session
    for (const arbitration of arbitrations) {
      const [reschedules] = await connection.execute(
        'SELECT * FROM arbitration_reschedule WHERE arbitration_id = ? ORDER BY created_at ASC',
        [arbitration.id]
      );
      
      // For each reschedule, fetch its specific documentation
      for (const reschedule of reschedules) {
        reschedule.documentation = [];
        if (reschedule.documentation_id) {
          try {
            const docIds = JSON.parse(reschedule.documentation_id);
            if (Array.isArray(docIds) && docIds.length > 0) {
              const placeholders = docIds.map(() => '?').join(',');
              const [docs] = await connection.execute(
                `SELECT file_path FROM arbitration_documentation WHERE id IN (${placeholders})`,
                docIds
              );
              reschedule.documentation = docs.map(d => d.file_path);
            }
          } catch (e) {
            console.error('Error parsing documentation_id for reschedule:', reschedule.id, e);
            reschedule.documentation = [];
          }
        }
      }
      
      arbitration.reschedules = reschedules;
      
      // Get the latest minutes from the most recent reschedule (if any)
      const latestReschedule = reschedules.length > 0 ? reschedules[reschedules.length - 1] : null;
      arbitration.minutes = latestReschedule ? latestReschedule.minutes : null;
      
      // Keep case-level documentation for backward compatibility
      const [docs] = await connection.execute(
        'SELECT file_path FROM arbitration_documentation WHERE arbitration_id = ?',
        [arbitration.id]
      );
      arbitration.documentation = docs.map(d => d.file_path);
    }
    res.json(Array.isArray(arbitrations) ? arbitrations : []); // Always return an array
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.saveArbitrationSession = async (req, res) => {
  const { arbitration_id, minutes } = req.body;
  const files = req.files || [];
  const connection = await connectDB();
  try {
    // Get current arbitration date and time
    const [arbitration] = await connection.execute(
      'SELECT date, time FROM arbitration WHERE id = ?',
      [arbitration_id]
    );
    
    if (arbitration.length === 0) {
      return res.status(404).json({ success: false, error: 'Arbitration not found' });
    }
    
    const { date, time } = arbitration[0];
    
    // Insert documentation files first and collect their IDs
    const documentationIds = [];
    for (const file of files) {
      const [result] = await connection.execute(
        'INSERT INTO arbitration_documentation (arbitration_id, file_path) VALUES (?, ?)',
        [arbitration_id, file.path]
      );
      documentationIds.push(result.insertId);
    }
    
    // Convert documentation IDs to JSON string for storage
    // Use NULL for no files, or JSON array for files
    const documentationIdsJson = documentationIds.length > 0 ? JSON.stringify(documentationIds) : null;
    
    console.log('Documentation processing:', {
      filesCount: files.length,
      documentationIds,
      documentationIdsJson
    });
    
    // Check if reschedule record exists for current date/time
    const [existingReschedule] = await connection.execute(
      'SELECT id FROM arbitration_reschedule WHERE arbitration_id = ? AND reschedule_date = ? AND reschedule_time = ?',
      [arbitration_id, date, time]
    );
    
    if (existingReschedule.length > 0) {
      // Update existing reschedule record with minutes and documentation IDs
      await connection.execute(
        'UPDATE arbitration_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
        [minutes, documentationIdsJson, existingReschedule[0].id]
      );
    } else {
      // Create new reschedule record for current session with documentation IDs
      await connection.execute(
        'INSERT INTO arbitration_reschedule (arbitration_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?)',
        [arbitration_id, date, time, minutes, 'Initial session', documentationIdsJson]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.softDeleteSession = async (req, res) => {
  const { id } = req.params;
  const connection = await connectDB();
  try {
    await connection.execute(
      'DELETE FROM arbitration_reschedule WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Reschedule an arbitration session
exports.rescheduleArbitration = async (req, res) => {
  const { arbitration_id, reschedule_date, reschedule_time, reason } = req.body;
  const connection = await connectDB();
  try {
    // Insert reschedule record (no minutes initially)
    await connection.execute(
      'INSERT INTO arbitration_reschedule (arbitration_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
      [arbitration_id, reschedule_date, reschedule_time, reason]
    );
    
    // Update arbitration schedule to reflect current active schedule
    await connection.execute(
      'UPDATE arbitration SET date = ?, time = ? WHERE id = ?',
      [reschedule_date, reschedule_time, arbitration_id]
    );
    
    // Get complaint_id for notification
    const [arbitration] = await connection.execute(
      'SELECT complaint_id FROM arbitration WHERE id = ?',
      [arbitration_id]
    );
    
    if (arbitration.length > 0) {
      // Create notification for users about reschedule
      await notifyUsersAboutCase(arbitration[0].complaint_id, 'session_rescheduled');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in rescheduleArbitration:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get arbitration data by case ID for minutes validation
exports.getArbitrationByCase = async (req, res) => {
  const { complaint_id } = req.params;
  const connection = await connectDB();
  try {
    // Get arbitration data with reschedules
    const [arbitrations] = await connection.execute(
      'SELECT * FROM arbitration WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );
    
    if (arbitrations.length === 0) {
      return res.json([]);
    }
    
    // Get reschedule data for each arbitration
    for (let arbitration of arbitrations) {
      const [reschedules] = await connection.execute(
        'SELECT * FROM arbitration_reschedule WHERE arbitration_id = ? ORDER BY id ASC',
        [arbitration.id]
      );
      arbitration.reschedules = reschedules;
    }
    
    res.json(arbitrations);
  } catch (error) {
    console.error('Error in getArbitrationByCase:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};
