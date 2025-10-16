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
         to_char(reschedule_date, 'YYYY-MM-DD') as reschedule_date,
         reschedule_time, reason, minutes, documentation_id, created_at
         FROM mediation_reschedule WHERE mediation_id = ? ORDER BY created_at ASC`,
        [mediation.id]
      );
      
      // For each reschedule, fetch its specific documentation
      for (const reschedule of reschedules) {
        reschedule.documentation = [];
        console.log(`\n=== DEBUGGING RESCHEDULE ${reschedule.id} ===`);
        console.log('Raw documentation_id:', reschedule.documentation_id);
        console.log('Type of documentation_id:', typeof reschedule.documentation_id);
        
        if (reschedule.documentation_id) {
          try {
            const docIds = JSON.parse(reschedule.documentation_id);
            console.log('Parsed docIds:', docIds);
            console.log('Is array:', Array.isArray(docIds));
            console.log('Array length:', docIds.length);
            
            if (Array.isArray(docIds) && docIds.length > 0) {
              // Filter out null/undefined values
              const validDocIds = docIds.filter(id => id !== null && id !== undefined);
              console.log('Valid docIds after filtering:', validDocIds);
              
              if (validDocIds.length > 0) {
                const placeholders = validDocIds.map(() => '?').join(',');
                console.log('SQL query:', `SELECT file_path FROM mediation_documentation WHERE id IN (${placeholders})`);
                console.log('Query params:', validDocIds);
                
                const [docs] = await connection.execute(
                  `SELECT file_path FROM mediation_documentation WHERE id IN (${placeholders})`,
                  validDocIds
                );
                console.log('Retrieved docs from DB:', docs);
                
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                reschedule.documentation = docs.map(d => `${baseUrl}/${d.file_path}`);
                console.log('Final documentation URLs:', reschedule.documentation);
              } else {
                console.log('No valid document IDs found after filtering');
              }
            } else {
              console.log('docIds is not a valid array or is empty');
            }
          } catch (e) {
            console.error('Error parsing documentation_id for reschedule:', reschedule.id, e);
            console.error('Raw documentation_id that failed:', reschedule.documentation_id);
            reschedule.documentation = [];
          }
        } else {
          console.log('No documentation_id found for this reschedule');
        }
        
        console.log('Final reschedule.documentation:', reschedule.documentation);
        console.log('=== END DEBUGGING RESCHEDULE ===\n');
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
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const [docs] = await connection.execute(
        'SELECT file_path FROM mediation_documentation WHERE mediation_id = ?',
        [mediation.id]
      );
      mediation.documentation = docs.map(d => `${baseUrl}/${d.file_path}`);
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
  
  console.log('\n=== SAVE SESSION DEBUGGING ===');
  console.log('Request body:', req.body);
  console.log('Files received:', files.length);
  console.log('Files details:', files.map(f => ({ 
    filename: f.filename, 
    originalname: f.originalname, 
    mimetype: f.mimetype, 
    size: f.size 
  })));
  console.log('=== END DEBUGGING ===\n');
  
  const connection = await connectDB();
  try {
    // Use the model function to save the session
    const rescheduleId = await saveMediationSessionDb(connection, {
      mediation_id,
      minutes,
      files
    });
    
    console.log('✅ Session saved successfully with reschedule ID:', rescheduleId);
    
    res.json({ success: true, reschedule_id: rescheduleId });
  } catch (error) {
    console.error('Error in saveMediationSession:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
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
// Clean up existing records with null documentation IDs
exports.cleanupDocumentationIds = async (req, res) => {
  const connection = await connectDB();
  try {
    console.log('Starting cleanup of null documentation IDs...');
    
    // Find records with '[null]' or similar problematic values
    const [problematicRecords] = await connection.execute(
      `SELECT id, documentation_id FROM mediation_reschedule 
       WHERE documentation_id IS NOT NULL 
       AND (documentation_id = '[null]' OR documentation_id = 'null' OR documentation_id = '[]')`
    );
    
    console.log('Found problematic records:', problematicRecords.length);
    
    // Update these records to have proper empty array
    if (problematicRecords.length > 0) {
      await connection.execute(
        `UPDATE mediation_reschedule 
         SET documentation_id = '[]' 
         WHERE documentation_id = '[null]' OR documentation_id = 'null'`
      );
      console.log('Updated problematic records to have empty arrays');
    }
    
    res.json({ 
      success: true, 
      message: `Cleaned up ${problematicRecords.length} records` 
    });
  } catch (error) {
    console.error('Error in cleanupDocumentationIds:', error);
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