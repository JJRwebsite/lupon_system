const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');

exports.setMediationSchedule = async (req, res) => {
  const { complaint_id, date, time } = req.body;
  const connection = await connectDB();
  try {
    // VALIDATION: Check scheduling constraints
    const [existingSchedules] = await connection.execute(
      'SELECT id, complaint_id, time FROM mediation WHERE date = ? AND is_deleted = 0',
      [date]
    );

    // Check if maximum 4 schedules per day
    if (existingSchedules.length >= 4) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 4 mediation sessions allowed per day. Please choose a different date.' 
      });
    }

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    // Check for time conflicts
    const selectedTimeMinutes = timeToMinutes(time);
    
    for (const schedule of existingSchedules) {
      // Skip if this is the same complaint (updating existing mediation)
      if (schedule.complaint_id === complaint_id) continue;
      
      const existingTimeMinutes = timeToMinutes(schedule.time);
      const timeDifference = Math.abs(selectedTimeMinutes - existingTimeMinutes);
      
      // Check for exact time match (0 minutes difference)
      if (timeDifference === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'This time slot is already booked. Please choose a different time.' 
        });
      }
      
      // Check 1-hour interval constraint (60 minutes = 1 hour)
      if (timeDifference < 60) {
        return res.status(400).json({ 
          success: false, 
          error: 'Minimum 1-hour interval required between mediation sessions. Please choose a different time.' 
        });
      }
    }

    // Check if mediation already exists for this complaint
    const [existing] = await connection.execute(
      'SELECT id FROM mediation WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );

    if (existing.length > 0) {
      // Update existing mediation
      await connection.execute(
        'UPDATE mediation SET date = ?, time = ? WHERE complaint_id = ? AND is_deleted = 0',
        [date, time, complaint_id]
      );
    } else {
      // Create new mediation (no minutes column)
      await connection.execute(
        'INSERT INTO mediation (complaint_id, date, time) VALUES (?, ?, ?)',
        [complaint_id, date, time]
      );
    }
    
    // Clear any existing conciliation and arbitration schedules for this complaint to free up time slots
    // This handles cases where a case is moved back to mediation from later processes
    await connection.execute(
      'DELETE FROM conciliation WHERE complaint_id = ?',
      [complaint_id]
    );
    
    await connection.execute(
      'UPDATE arbitration SET is_deleted = 1 WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );
    
    // Update complaint status to 'Mediation'
    await connection.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      ['Mediation', complaint_id]
    );
    
    // Create notification for users
    await notifyUsersAboutCase(complaint_id, 'mediation_scheduled');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in setMediationSchedule:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all mediation schedules with joined complaint, complainant, and respondent info
exports.getAllMediations = async (req, res) => {
  const connection = await connectDB();
  try {
    const [mediations] = await connection.execute(
      `SELECT m.id, m.complaint_id, 
        DATE_FORMAT(m.date, '%Y-%m-%d') as date, 
        m.time, m.created_at, c.case_title,
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
        END AS respondent,
        CASE 
          WHEN witness_res.lastname IS NOT NULL AND witness_res.firstname IS NOT NULL THEN 
            CONCAT(UPPER(witness_res.lastname), ', ', UPPER(witness_res.firstname), 
                   CASE WHEN witness_res.middlename IS NOT NULL AND witness_res.middlename != '' 
                        THEN CONCAT(' ', UPPER(witness_res.middlename)) 
                        ELSE '' END)
          WHEN witness_res.lastname IS NOT NULL THEN UPPER(witness_res.lastname)
          WHEN witness_res.firstname IS NOT NULL THEN UPPER(witness_res.firstname)
          WHEN witness_res.id IS NOT NULL THEN CONCAT('RESIDENT #', witness_res.id)
          ELSE 'UNKNOWN WITNESS'
        END AS witness,
        witness_res.purok AS witness_purok,
        witness_res.contact AS witness_contact,
        witness_res.barangay AS witness_barangay
      FROM mediation m
      JOIN complaints c ON m.complaint_id = c.id
      LEFT JOIN residents complainant_res ON c.complainant_id = complainant_res.id
      LEFT JOIN residents respondent_res ON c.respondent_id = respondent_res.id
      LEFT JOIN residents witness_res ON c.witness_id = witness_res.id
      WHERE m.is_deleted = 0 AND c.status = 'Mediation'
      ORDER BY m.id DESC`
    );
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
  } finally {
    await connection.end();
  }
};

exports.softDeleteSession = async (req, res) => {
  const { id } = req.params;
  const connection = await connectDB();
  try {
    await connection.execute(
      'UPDATE mediation SET is_deleted = 1 WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Reschedule a mediation session
exports.rescheduleMediation = async (req, res) => {
  const { mediation_id, reschedule_date, reschedule_time, reason } = req.body;
  const connection = await connectDB();
  try {
    // Get complaint_id from mediation record for notification
    const [mediationResult] = await connection.execute(
      'SELECT complaint_id FROM mediation WHERE id = ?',
      [mediation_id]
    );
    
    if (mediationResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Mediation not found' });
    }
    
    const complaint_id = mediationResult[0].complaint_id;
    
    // Insert reschedule record (no minutes initially)
    await connection.execute(
      'INSERT INTO mediation_reschedule (mediation_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
      [mediation_id, reschedule_date, reschedule_time, reason]
    );
    
    // Update mediation schedule to reflect current active schedule
    await connection.execute(
      'UPDATE mediation SET date = ?, time = ? WHERE id = ?',
      [reschedule_date, reschedule_time, mediation_id]
    );
    
    // Create notification for users about reschedule
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
    // Get all scheduled sessions for the given date from ALL THREE systems: mediation, conciliation, and arbitration
    // Since they share the same time slots, we need to check all three for complete cross-system validation
    const [mediationSchedules] = await connection.execute(
      'SELECT time FROM mediation WHERE date = ? AND is_deleted = 0',
      [date]
    );
    
    const [conciliationSchedules] = await connection.execute(
      'SELECT time FROM conciliation WHERE date = ?',
      [date]
    );
    
    const [arbitrationSchedules] = await connection.execute(
      'SELECT time FROM arbitration WHERE date = ? AND is_deleted = 0',
      [date]
    );

    // Define all available time slots
    const allTimeSlots = [
      '08:00', '09:00', '10:00', '11:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    // Combine booked times from mediation, conciliation, AND arbitration
    const mediationTimes = mediationSchedules.map(schedule => schedule.time);
    const conciliationTimes = conciliationSchedules.map(schedule => schedule.time);
    const arbitrationTimes = arbitrationSchedules.map(schedule => schedule.time);
    const allBookedTimes = [...mediationTimes, ...conciliationTimes, ...arbitrationTimes];
    
    // Remove duplicates and get unique booked times
    const bookedTimes = [...new Set(allBookedTimes)];
    
    // Calculate available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
    const usedSlots = bookedTimes.length;
    const maxSlotsPerDay = 4;
    const isFull = usedSlots >= maxSlotsPerDay;

    // Format scheduled times for display (convert to 12-hour format)
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
        availableSlots: availableSlots.length,
        usedSlots,
        maxSlotsPerDay,
        scheduledTimes,
        bookedTimes, // Raw 24-hour format for frontend filtering
        isFull
      }
    });

  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
}; 