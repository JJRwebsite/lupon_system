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

// Get all arbitration schedules with joined complaint, complainant, and respondent info (like mediation/conciliation)
exports.getAllArbitrations = async (req, res) => {
  const connection = await connectDB();
  try {
    console.log('🔍 getAllArbitrations - Starting to fetch arbitrations');
    const arbitrations = await listAllArbitrationsDetailed(connection);
    console.log('🔍 getAllArbitrations - Found arbitrations:', arbitrations.length);
    
    // Ensure arbitrations is an array
    if (!Array.isArray(arbitrations)) {
      console.error('❌ getAllArbitrations - Expected array, got:', typeof arbitrations);
      return res.json([]);
    }
    
    console.log('✅ getAllArbitrations - Successfully processed arbitrations');
    res.json(arbitrations);
  } catch (error) {
    console.error('❌ getAllArbitrations - Fatal error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
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
