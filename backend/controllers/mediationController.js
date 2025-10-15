const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');
const {
  getAvailableSlotsDetails,
  setMediationScheduleDb,
  listAllMediationsDetailed,
  saveMediationSessionDb,
  softDeleteMediationDb,
  rescheduleMediationDb,
} = require('../models/mediationModel');

exports.setMediationSchedule = async (req, res) => {
  const { complaint_id, date, time } = req.body;
  const connection = await connectDB();
  try {
    await setMediationScheduleDb(connection, { complaint_id, date, time });
    await notifyUsersAboutCase(complaint_id, 'mediation_scheduled');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in setMediationSchedule:', error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all mediation schedules with joined complaint, complainant, and respondent info
exports.getAllMediations = async (req, res) => {
  const connection = await connectDB();
  try {
    const mediations = await listAllMediationsDetailed(connection);
    // Fetch reschedules and their specific documentation for each mediation session
    for (const mediation of mediations) {
      const [reschedules] = await connection.execute(
        `SELECT id, mediation_id, 
         DATE_FORMAT(reschedule_date, '%Y-%m-%d') as reschedule_date,
         reschedule_time, reason, minutes, documentation_id, created_at
         FROM mediation_reschedule WHERE mediation_id = ? ORDER BY created_at ASC`,
        [mediation.id]
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
                `SELECT file_path FROM mediation_documentation WHERE id IN (${placeholders})`,
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
      
      mediation.reschedules = reschedules;
      
      // Get the latest minutes from the most recent reschedule (if any)
      const latestReschedule = reschedules.length > 0 ? reschedules[reschedules.length - 1] : null;
      mediation.minutes = latestReschedule ? latestReschedule.minutes : null;
      
      // Add initial session timestamp for time elapsed calculation
      // Find the first reschedule with reason 'Initial session' or the first reschedule overall
      const initialSession = reschedules.find(r => r.reason === 'Initial session') || reschedules[0];
      mediation.initial_session_start = initialSession ? initialSession.created_at : null;
      
      // Keep case-level documentation for backward compatibility
      const [docs] = await connection.execute(
        'SELECT file_path FROM mediation_documentation WHERE mediation_id = ?',
        [mediation.id]
      );
      mediation.documentation = docs.map(d => d.file_path);
    }
    res.json(Array.isArray(mediations) ? mediations : []); // Always return an array
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

exports.saveMediationSession = async (req, res) => {
  const { mediation_id, minutes } = req.body;
  const files = req.files || [];
  const connection = await connectDB();
  try {
    // Get current mediation date and time
    const [mediation] = await connection.execute(
      'SELECT date, time FROM mediation WHERE id = ?',
      [mediation_id]
    );
    
    if (mediation.length === 0) {
      return res.status(404).json({ success: false, error: 'Mediation not found' });
    }
    
    const { date, time } = mediation[0];
    
    // Insert documentation files first and collect their IDs
    const documentationIds = [];
    for (const file of files) {
      // Store clean relative path (without leading slash to avoid double slash issues)
      const cleanPath = `uploads/mediation/${file.filename}`;
      
      const [result] = await connection.execute(
        'INSERT INTO mediation_documentation (mediation_id, file_path) VALUES (?, ?)',
        [mediation_id, cleanPath]
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
      'SELECT id FROM mediation_reschedule WHERE mediation_id = ? AND reschedule_date = ? AND reschedule_time = ?',
      [mediation_id, date, time]
    );
    
    if (existingReschedule.length > 0) {
      // Update existing reschedule record with minutes and documentation IDs
      await connection.execute(
        'UPDATE mediation_reschedule SET minutes = ?, documentation_id = ? WHERE id = ?',
        [minutes, documentationIdsJson, existingReschedule[0].id]
      );
    } else {
      // Create new reschedule record for current session with documentation IDs
      await connection.execute(
        'INSERT INTO mediation_reschedule (mediation_id, reschedule_date, reschedule_time, minutes, reason, documentation_id) VALUES (?, ?, ?, ?, ?, ?)',
        [mediation_id, date, time, minutes, 'Initial session', documentationIdsJson]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.softDeleteSession = async (req, res) => {
  const { mediation_id } = req.params;
  const connection = await connectDB();
  try {
    await softDeleteMediationDb(connection, mediation_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error soft deleting mediation session:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Reschedule a mediation session
exports.rescheduleMediation = async (req, res) => {
  const connection = await connectDB();
  try {
    const { mediation_id, reschedule_date, reschedule_time, reason } = req.body;
    const complaint_id = await rescheduleMediationDb(connection, { mediation_id, reschedule_date, reschedule_time, reason });
    await notifyUsersAboutCase(complaint_id, 'session_rescheduled');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in rescheduleMediation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get available slots for a specific date
exports.getAvailableSlots = async (req, res) => {
  const { date } = req.params;
  const connection = await connectDB();
  try {
    const { availableTimes, bookedTimes, usedSlots, maxSlotsPerDay, isFull } = await getAvailableSlotsDetails(connection, date);
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
        availableSlots: availableTimes.length,
        usedSlots,
        maxSlotsPerDay,
        scheduledTimes,
        bookedTimes,
        isFull,
      },
    });
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};