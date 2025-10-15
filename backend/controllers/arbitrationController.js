const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');
const {
  setArbitrationScheduleDb,
  listAllArbitrationsDetailed,
  saveArbitrationSessionDb,
  softDeleteArbitrationRescheduleDb,
  rescheduleArbitrationDb,
  getArbitrationByCaseDetailed,
} = require('../models/arbitrationModel');

exports.setArbitrationSchedule = async (req, res) => {
  console.log('🔍 setArbitrationSchedule - Received body:', req.body);
  const { complaint_id, date, time, panel_members } = req.body;
  console.log('🔍 setArbitrationSchedule - Parsed values:', { complaint_id, date, time, panel_members });
  
  const connection = await connectDB();
  try {
    await setArbitrationScheduleDb(connection, { complaint_id, date, time, panel_members });
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
    const arbitrations = await listAllArbitrationsDetailed(connection);
    
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
  const { arbitration_id } = req.body;
  let { date, time, minutes } = req.body;
  const files = req.files ? req.files.map(f => f.path) : [];
  const connection = await connectDB();
  try {
    // Fallback to current arbitration date/time if not provided by client
    if (!date || !time) {
      const [rows] = await connection.execute(
        'SELECT date, time FROM arbitration WHERE id = ?',
        [arbitration_id]
      );
      if (rows.length > 0) {
        date = rows[0].date;
        time = rows[0].time;
      }
    }
    await saveArbitrationSessionDb(connection, { arbitration_id, date, time, minutes, files });
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
    await softDeleteArbitrationRescheduleDb(connection, id);
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
    const complaint_id = await rescheduleArbitrationDb(connection, { arbitration_id, reschedule_date, reschedule_time, reason });
    if (complaint_id) {
      await notifyUsersAboutCase(complaint_id, 'session_rescheduled');
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
    const arbitrations = await getArbitrationByCaseDetailed(connection, complaint_id);
    res.json(arbitrations);
  } catch (error) {
    console.error('Error in getArbitrationByCase:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};
