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

// Helper function to calculate time elapsed from scheduled date
function calculateTimeElapseFromSchedule(conciliationGroup) {
  // Find the earliest scheduled date from all conciliation sessions
  let earliestScheduledDate = null;
  
  console.log('🔍 DEBUG: Calculating time elapsed for conciliation group:', conciliationGroup.map(c => ({ id: c.id, date: c.date, reschedules: c.reschedules?.length || 0 })));
  
  conciliationGroup.forEach(con => {
    // Check if this conciliation has reschedules with scheduled dates
    if (con.reschedules && Array.isArray(con.reschedules)) {
      con.reschedules.forEach(reschedule => {
        if (reschedule.reschedule_date) {
          if (!earliestScheduledDate || new Date(reschedule.reschedule_date) < new Date(earliestScheduledDate)) {
            earliestScheduledDate = reschedule.reschedule_date;
          }
        }
      });
    }
    
    // Also check the main conciliation date as fallback
    if (con.date) {
      if (!earliestScheduledDate || new Date(con.date) < new Date(earliestScheduledDate)) {
        earliestScheduledDate = con.date;
      }
    }
  });
  
  console.log('🔍 DEBUG: Earliest scheduled date found:', earliestScheduledDate);
  
  // Calculate days elapsed from earliest scheduled date
  let daysElapsed = 0;
  if (earliestScheduledDate) {
    const today = new Date();
    const scheduled = new Date(earliestScheduledDate);
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    daysElapsed = Math.floor((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('🔍 DEBUG: Raw days elapsed calculation:', daysElapsed);
    
    // Clamp the elapsed days between 0 and 15
    if (daysElapsed < 0) daysElapsed = 0;
    if (daysElapsed > 15) daysElapsed = 15;
  }
  
  console.log('🔍 DEBUG: Final days elapsed after clamping:', daysElapsed);
  
  // Ensure we never return a negative value
  return Math.max(0, daysElapsed);
}

// Get all conciliation schedules with joined complaint, complainant, and respondent info
exports.getAllConciliations = async (req, res) => {
  const connection = await connectDB();
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const conciliations = await listAllConciliationsBasic(connection);
    
    // Group conciliations by complaint_id for time elapsed calculation
    const conciliationsByComplaint = {};
    conciliations.forEach(con => {
      if (!conciliationsByComplaint[con.complaint_id]) {
        conciliationsByComplaint[con.complaint_id] = [];
      }
      conciliationsByComplaint[con.complaint_id].push(con);
    });
    
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
              reschedule.documentation = docs.map(d => `${baseUrl}/${d.file_path}`);
            }
          } catch (e) {
            console.error('Error parsing documentation_id for reschedule:', reschedule.id, e);
            reschedule.documentation = [];
          }
        }
      }
      
      conciliation.reschedules = reschedules;
      
      // Calculate time elapsed for this conciliation's complaint group
      const complaintGroup = conciliationsByComplaint[conciliation.complaint_id] || [conciliation];
      const daysElapsed = calculateTimeElapseFromSchedule(complaintGroup);
      conciliation.time_elapse = `${daysElapsed}/15`;
      
      // Get the latest minutes from the most recent reschedule (if any)
      const latestReschedule = reschedules.length > 0 ? reschedules[reschedules.length - 1] : null;
      conciliation.minutes = (latestReschedule && latestReschedule.minutes)
        ? latestReschedule.minutes
        : (conciliation.minutes || null);
      
      // Keep case-level documentation for backward compatibility
      const [docs] = await connection.execute(
        'SELECT file_path FROM conciliation_documentation WHERE conciliation_id = ?',
        [conciliation.id]
      );
      conciliation.documentation = docs.map(d => `${baseUrl}/${d.file_path}`);
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
    await saveConciliationSessionDb(connection, { conciliation_id, minutes, files });
    res.json({ success: true });
  } catch (error) {
    console.error('Error in saveConciliationSession:', error);
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