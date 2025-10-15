const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');
const {
  setConciliationScheduleDb,
  saveConciliationSessionDb,
  softDeleteConciliationDb,
  rescheduleConciliationDb,
  getAvailableSlotsDetails,
  listUserConciliationSchedulesDetailed,
  listAllConciliationsBasic,
} = require('../models/conciliationModel');

exports.setConciliationSchedule = async (req, res) => {
  const { complaint_id, date, time, panel } = req.body;
  const connection = await connectDB();
  try {
    await setConciliationScheduleDb(connection, { complaint_id, date, time, panel });
    await notifyUsersAboutCase(complaint_id, 'conciliation_scheduled');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in setConciliationSchedule:', error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.saveConciliationSession = async (req, res) => {
  const { conciliation_id, minutes } = req.body;
  const files = req.files || [];
  const connection = await connectDB();
  try {
    await saveConciliationSessionDb(connection, { conciliation_id, minutes, files });
    res.json({ success: true });
  } catch (error) {
    console.error('Error in saveConciliationSession:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.softDeleteConciliation = async (req, res) => {
  const { conciliation_id } = req.body;
  const connection = await connectDB();
  try {
    await softDeleteConciliationDb(connection, conciliation_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in softDeleteConciliation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.rescheduleConciliation = async (req, res) => {
  const { conciliation_id, new_date, new_time } = req.body;
  const connection = await connectDB();
  try {
    await rescheduleConciliationDb(connection, { conciliation_id, new_date, new_time });
    res.json({ success: true });
  } catch (error) {
    console.error('Error in rescheduleConciliation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all conciliation schedules with joined complaint, complainant, and respondent info
exports.getAllConciliations = async (req, res) => {
  const connection = await connectDB();
  try {
    const conciliations = await listAllConciliationsBasic(connection);
    
    // Fetch reschedules and their specific documentation for each conciliation session
    for (const conciliation of conciliations) {
      const [reschedules] = await connection.execute(
        'SELECT * FROM conciliation_reschedule WHERE conciliation_id = ? ORDER BY created_at ASC',
        [conciliation.id]
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
                `SELECT file_path FROM conciliation_documentation WHERE id IN (${placeholders})`,
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
      
      conciliation.reschedules = reschedules;
      
      // Get the latest minutes from the most recent reschedule (if any)
      const latestReschedule = reschedules.length > 0 ? reschedules[reschedules.length - 1] : null;
      conciliation.minutes = latestReschedule ? latestReschedule.minutes : null;
      
      // Keep case-level documentation for backward compatibility
      const [docs] = await connection.execute(
        'SELECT file_path FROM conciliation_documentation WHERE conciliation_id = ?',
        [conciliation.id]
      );
      conciliation.documentation = docs.map(d => d.file_path);
    }
    
    res.json(Array.isArray(conciliations) ? conciliations : []);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.saveConciliationSession = async (req, res) => {
  const { conciliation_id, minutes } = req.body;
  const files = req.files || [];
  const connection = await connectDB();
  try {
    // Get current conciliation date and time
    const [conciliation] = await connection.execute(
      'SELECT date, time FROM conciliation WHERE id = ?',
      [conciliation_id]
    );
    
    if (conciliation.length === 0) {
      return res.status(404).json({ success: false, error: 'Conciliation not found' });
    }
    
    const { date, time } = conciliation[0];
    
    // Insert documentation files first and collect their IDs
    const documentationIds = [];
    for (const file of files) {
      const [result] = await connection.execute(
        'INSERT INTO conciliation_documentation (conciliation_id, file_path) VALUES (?, ?)',
        [conciliation_id, file.path]
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
      'SELECT id FROM conciliation_reschedule WHERE conciliation_id = ? AND reschedule_date = ? AND reschedule_time = ?',
      [conciliation_id, date, time]
    );
    
    if (existingReschedule.length > 0) {
      // Update existing reschedule record with minutes and documentation IDs
      await connection.execute(
        'UPDATE conciliation_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
        [minutes, documentationIdsJson, existingReschedule[0].id]
      );
    } else {
      // Create new reschedule record for current session with documentation IDs
      await connection.execute(
        'INSERT INTO conciliation_reschedule (conciliation_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?)',
        [conciliation_id, date, time, minutes, 'Initial session', documentationIdsJson]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all conciliation schedules for the logged-in user's cases
exports.getUserConciliationSchedules = async (req, res) => {
  const connection = await connectDB();
  try {
    const userId = req.user.id; // set by verifyToken middleware
    const schedules = await listUserConciliationSchedulesDetailed(connection, userId);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching user conciliation schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user conciliation schedules', error: error.message });
  } finally {
    await connection.end();
  }
};

exports.softDeleteSession = async (req, res) => {
  const { id } = req.params;
  const connection = await connectDB();
  try {
    await softDeleteConciliationDb(connection, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in softDeleteSession:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Reschedule a conciliation session
exports.rescheduleConciliation = async (req, res) => {
  const { conciliation_id, reschedule_date, reschedule_time, reason } = req.body;
  const connection = await connectDB();
  try {
    const complaint_id = await rescheduleConciliationDb(connection, { conciliation_id, reschedule_date, reschedule_time, reason });
    await notifyUsersAboutCase(complaint_id, 'session_rescheduled');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in rescheduleConciliation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get available slots for a specific date
exports.getAvailableSlots = async (req, res) => {
  const { date } = req.params;
  const { excludeConciliationId } = req.query;
  const connection = await connectDB();
  try {
    const { availableSlotsLen, usedSlots, actualUsedSlots, maxSlotsPerDay, bookedTimes, isFull } = await getAvailableSlotsDetails(connection, date, excludeConciliationId || null);
    const formatTime = (time24) => {
      const [hours, minutes] = time24.split(':');
      const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      const displayHour = hour12 === 0 ? 12 : hour12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    const scheduledTimes = bookedTimes.map(formatTime);
    res.json({
      success: true,
      data: {
        availableSlots: availableSlotsLen,
        usedSlots,
        actualUsedSlots,
        maxSlotsPerDay,
        scheduledTimes,
        bookedTimes,
        isFull,
        isReschedule: !!excludeConciliationId,
      }
    });
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};