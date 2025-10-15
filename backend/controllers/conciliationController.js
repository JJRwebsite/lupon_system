const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');

exports.setConciliationSchedule = async (req, res) => {
  console.log('Received body:', req.body); // Debug log
  const { complaint_id, date, time, panel } = req.body;
  
  // Additional debugging
  console.log('Parsed values:', { complaint_id, date, time, panel });
  
  const connection = await connectDB();
  try {
    // VALIDATION: Check scheduling constraints for BOTH mediation and conciliation
    // Get existing mediation schedules for the date
    const [existingMediationSchedules] = await connection.execute(
      'SELECT id, complaint_id, time FROM mediation WHERE date = ? AND is_deleted = 0',
      [date]
    );
    
    // Get existing conciliation schedules for the date
    const [existingConciliationSchedules] = await connection.execute(
      'SELECT id, complaint_id, time FROM conciliation WHERE date = ?',
      [date]
    );
    
    // Combine all existing schedules (both mediation and conciliation)
    const allExistingSchedules = [
      ...existingMediationSchedules.map(s => ({ ...s, type: 'mediation' })),
      ...existingConciliationSchedules.map(s => ({ ...s, type: 'conciliation' }))
    ];

    console.log('All existing schedules for date', date, ':', allExistingSchedules);

    // Check if maximum 4 schedules per day (combined mediation + conciliation)
    if (allExistingSchedules.length >= 4) {
      console.log('Rejecting: Maximum sessions reached');
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 4 sessions allowed per day (mediation + conciliation combined). Please choose a different date.' 
      });
    }

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    // Check for time conflicts with ALL existing sessions (mediation + conciliation)
    const selectedTimeMinutes = timeToMinutes(time);
    
    for (const schedule of allExistingSchedules) {
      // Skip if this is the same complaint updating existing conciliation
      if (schedule.complaint_id === complaint_id && schedule.type === 'conciliation') continue;
      
      const existingTimeMinutes = timeToMinutes(schedule.time);
      const timeDifference = Math.abs(selectedTimeMinutes - existingTimeMinutes);
      
      // Check for exact time match (0 minutes difference)
      if (timeDifference === 0) {
        return res.status(400).json({ 
          success: false, 
          error: `This time slot is already booked by a ${schedule.type} session. Please choose a different time.` 
        });
      }
      
      // Check 1-hour interval constraint (60 minutes = 1 hour)
      if (timeDifference < 60) {
        return res.status(400).json({ 
          success: false, 
          error: `Minimum 1-hour interval required between sessions. There is a ${schedule.type} session too close to this time. Please choose a different time.` 
        });
      }
    }

    // Check if conciliation already exists for this complaint
    const [existing] = await connection.execute(
      'SELECT id FROM conciliation WHERE complaint_id = ?',
      [complaint_id]
    );

    if (existing.length > 0) {
      // Update existing conciliation
      await connection.execute(
        'UPDATE conciliation SET date = ?, time = ?, lupon_panel = ? WHERE complaint_id = ?',
        [date, time, JSON.stringify(panel || []), complaint_id]
      );
    } else {
      // Insert new conciliation
      await connection.execute(
        'INSERT INTO conciliation (complaint_id, date, time, lupon_panel) VALUES (?, ?, ?, ?)',
        [complaint_id, date, time, JSON.stringify(panel || [])]
      );
    }
    
    // Clear any existing mediation schedule for this complaint to free up the time slot
    // This prevents the old mediation time slot from being counted as "booked"
    await connection.execute(
      'UPDATE mediation SET is_deleted = 1 WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );
    
    // Clear any existing arbitration schedule to handle rollbacks from arbitration to conciliation
    await connection.execute(
      'UPDATE arbitration SET is_deleted = 1 WHERE complaint_id = ? AND is_deleted = 0',
      [complaint_id]
    );
    
    // Update complaint status to 'Conciliation'
    await connection.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      ['Conciliation', complaint_id]
    );
    
    // Create notification for users
    await notifyUsersAboutCase(complaint_id, 'conciliation_scheduled');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in setConciliationSchedule:', error); // Debug log
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all conciliation schedules with joined complaint, complainant, and respondent info
exports.getAllConciliations = async (req, res) => {
  const connection = await connectDB();
  try {
    const [conciliations] = await connection.execute(
      `SELECT c.id, c.complaint_id, c.date, c.time, c.created_at, c.lupon_panel, comp.case_title,
        comp.status,
        CASE 
          WHEN compl.lastname IS NOT NULL AND compl.firstname IS NOT NULL THEN 
            CONCAT(UPPER(compl.lastname), ', ', UPPER(compl.firstname), 
                   CASE WHEN compl.middlename IS NOT NULL AND compl.middlename != '' 
                        THEN CONCAT(' ', UPPER(compl.middlename)) 
                        ELSE '' END)
          WHEN compl.lastname IS NOT NULL THEN UPPER(compl.lastname)
          WHEN compl.firstname IS NOT NULL THEN UPPER(compl.firstname)
          WHEN compl.id IS NOT NULL THEN CONCAT('RESIDENT #', compl.id)
          ELSE 'UNKNOWN COMPLAINANT'
        END AS complainant,
        CASE 
          WHEN resp.lastname IS NOT NULL AND resp.firstname IS NOT NULL THEN 
            CONCAT(UPPER(resp.lastname), ', ', UPPER(resp.firstname), 
                   CASE WHEN resp.middlename IS NOT NULL AND resp.middlename != '' 
                        THEN CONCAT(' ', UPPER(resp.middlename)) 
                        ELSE '' END)
          WHEN resp.lastname IS NOT NULL THEN UPPER(resp.lastname)
          WHEN resp.firstname IS NOT NULL THEN UPPER(resp.firstname)
          WHEN resp.id IS NOT NULL THEN CONCAT('RESIDENT #', resp.id)
          ELSE 'UNKNOWN RESPONDENT'
        END AS respondent
      FROM conciliation c
      JOIN complaints comp ON c.complaint_id = comp.id
      LEFT JOIN residents compl ON comp.complainant_id = compl.id
      LEFT JOIN residents resp ON comp.respondent_id = resp.id
      WHERE comp.status = 'Conciliation'
      ORDER BY c.id DESC`
    );
    
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
  try {
    // Get current user from JWT token (set by verifyToken middleware)
    const userId = req.user.id;
    console.log('🔍 Getting conciliation schedules for user ID:', userId);
    const connection = await connectDB();
    // Get all complaints for this user
    const [complaints] = await connection.execute('SELECT * FROM complaints WHERE user_id = ?', [userId]);
    let schedules = [];
    for (const complaint of complaints) {
      // Get all conciliation sessions for this complaint
      const [conciliations] = await connection.execute('SELECT * FROM conciliation WHERE complaint_id = ?', [complaint.id]);
      for (const conciliation of conciliations) {
        schedules.push({
          id: conciliation.id,
          case_no: complaint.id,
          case_title: complaint.case_title,
          case_description: complaint.case_description,
          nature_of_case: complaint.nature_of_case,
          relief_description: complaint.relief_description,
          date_filed: complaint.date_filed,
          complainant: '', // can be filled if needed
          respondent: '', // can be filled if needed
          schedule_date: conciliation.date,
          schedule_time: conciliation.time,
          case_status: complaint.status,
        });
      }
    }
    // Fetch complainant/respondent names from residents table
    for (let sched of schedules) {
      const [complaint] = await connection.execute(`
        SELECT 
          TRIM(CONCAT(
            UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
            CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
          )) AS complainant_name,
          TRIM(CONCAT(
            UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
            CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
          )) AS respondent_name
        FROM complaints c
        LEFT JOIN residents comp ON c.complainant_id = comp.id
        LEFT JOIN residents resp ON c.respondent_id = resp.id
        WHERE c.id = ?
      `, [sched.case_no]);
      
      if (complaint.length > 0) {
        sched.complainant = complaint[0].complainant_name || '';
        sched.respondent = complaint[0].respondent_name || '';
      }
    }
    await connection.end();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching user conciliation schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user conciliation schedules', error: error.message });
  }
};

exports.softDeleteSession = async (req, res) => {
  const { id } = req.params;
  const connection = await connectDB();
  try {
    // For now, we'll actually delete the conciliation record since is_deleted column may not exist
    // In production, you should add is_deleted column to conciliation table
    await connection.execute(
      'DELETE FROM conciliation WHERE id = ?',
      [id]
    );
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
    // Get complaint_id from conciliation record for notification
    const [conciliationResult] = await connection.execute(
      'SELECT complaint_id FROM conciliation WHERE id = ?',
      [conciliation_id]
    );
    
    if (conciliationResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Conciliation not found' });
    }
    
    const complaint_id = conciliationResult[0].complaint_id;
    
    // Insert reschedule record (no minutes initially)
    await connection.execute(
      'INSERT INTO conciliation_reschedule (conciliation_id, reschedule_date, reschedule_time, reason) VALUES (?, ?, ?, ?)',
      [conciliation_id, reschedule_date, reschedule_time, reason]
    );
    
    // Update conciliation schedule to reflect current active schedule
    await connection.execute(
      'UPDATE conciliation SET date = ?, time = ? WHERE id = ?',
      [reschedule_date, reschedule_time, conciliation_id]
    );
    
    // Create notification for users about reschedule
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
    // Get all scheduled sessions for the given date from BOTH mediation and conciliation tables
    // Since they share the same time slots, we need to check both
    const [mediationSchedules] = await connection.execute(
      'SELECT time FROM mediation WHERE date = ? AND is_deleted = 0',
      [date]
    );
    
    // For conciliation, exclude the current session if rescheduling
    let conciliationQuery = 'SELECT time FROM conciliation WHERE date = ?';
    let conciliationParams = [date];
    
    if (excludeConciliationId) {
      conciliationQuery += ' AND id != ?';
      conciliationParams.push(excludeConciliationId);
    }
    
    const [conciliationSchedules] = await connection.execute(
      conciliationQuery,
      conciliationParams
    );

    // Define all available time slots
    const allTimeSlots = [
      '08:00', '09:00', '10:00', '11:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    // Combine booked times from both mediation and conciliation
    const mediationTimes = mediationSchedules.map(schedule => schedule.time);
    const conciliationTimes = conciliationSchedules.map(schedule => schedule.time);
    const allBookedTimes = [...mediationTimes, ...conciliationTimes];
    
    // Remove duplicates and get unique booked times
    const bookedTimes = [...new Set(allBookedTimes)];
    
    // Calculate available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
    const usedSlots = bookedTimes.length;
    const maxSlotsPerDay = 4; // Same as mediation - 4 sessions per day
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

    // For reschedule scenarios, also provide the actual total usage
    let actualUsedSlots = usedSlots;
    if (excludeConciliationId) {
      // Get the actual total without exclusion for display purposes
      const [allConciliationSchedules] = await connection.execute(
        'SELECT time FROM conciliation WHERE date = ?',
        [date]
      );
      const allConciliationTimes = allConciliationSchedules.map(schedule => schedule.time);
      const allActualBookedTimes = [...mediationTimes, ...allConciliationTimes];
      const actualBookedTimes = [...new Set(allActualBookedTimes)];
      actualUsedSlots = actualBookedTimes.length;
    }

    res.json({
      success: true,
      data: {
        availableSlots: availableSlots.length,
        usedSlots,
        actualUsedSlots, // Total slots actually used (for display)
        maxSlotsPerDay: maxSlotsPerDay,
        scheduledTimes,
        bookedTimes, // Raw 24-hour format for frontend filtering
        isFull,
        isReschedule: !!excludeConciliationId
      }
    });

  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await connection.end();
  }
};