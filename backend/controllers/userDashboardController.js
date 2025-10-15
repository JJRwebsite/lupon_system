const connectDB = require('../config/db');
const { getUserStatsData, getUserSchedulesData } = require('../models/userDashboardModel');

// Get user dashboard statistics
exports.getUserStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const userId = req.user.id;
    const connection = await connectDB();
    const data = await getUserStatsData(connection, userId);
    const stats = {
      totalCases: data.totalCases,
      pendingCases: data.pendingCases,
      settledCases: data.settledCases,
      mediationSchedules: data.mediationSchedules,
      totalMediation: data.totalMediation,
      yearlyData: data.yearlyData,
      statusDistribution: data.statusDistribution,
      recentActivities: data.recentActivities,
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user statistics', error: error.message });
  }
};

// Get user's upcoming schedules
exports.getUserSchedules = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const userId = req.user.id;
    const connection = await connectDB();
    // Fetch schedules via model
    const { mediationRows, conciliationRows, arbitrationRows } = await getUserSchedulesData(connection, userId);
    const [mediationSchedules] = await connection.execute(`
      SELECT 
        m.id,
        m.date,
        m.time,
        c.case_title,
        c.id as case_id,
        CASE 
          WHEN complainant.lastname IS NOT NULL AND complainant.firstname IS NOT NULL THEN 
            CONCAT(UPPER(complainant.lastname), ', ', UPPER(complainant.firstname), 
                   CASE WHEN complainant.middlename IS NOT NULL AND complainant.middlename != '' 
                        THEN CONCAT(' ', UPPER(complainant.middlename)) 
                        ELSE '' END)
          WHEN complainant.lastname IS NOT NULL THEN UPPER(complainant.lastname)
          WHEN complainant.firstname IS NOT NULL THEN UPPER(complainant.firstname)
          WHEN complainant.id IS NOT NULL THEN CONCAT('RESIDENT #', complainant.id)
          ELSE 'UNKNOWN COMPLAINANT'
        END as complainant_name,
        CASE 
          WHEN respondent.lastname IS NOT NULL AND respondent.firstname IS NOT NULL THEN 
            CONCAT(UPPER(respondent.lastname), ', ', UPPER(respondent.firstname), 
          ELSE 'UNKNOWN COMPLAINANT'
        END as complainant_name,
        CASE 
          WHEN respondent.lastname IS NOT NULL AND respondent.firstname IS NOT NULL THEN 
            CONCAT(UPPER(respondent.lastname), ', ', UPPER(respondent.firstname), 
                   CASE WHEN respondent.middlename IS NOT NULL AND respondent.middlename != '' 
                        THEN CONCAT(' ', UPPER(respondent.middlename)) 
                        ELSE '' END)
          WHEN respondent.lastname IS NOT NULL THEN UPPER(respondent.lastname)
          WHEN respondent.firstname IS NOT NULL THEN UPPER(respondent.firstname)
          WHEN respondent.id IS NOT NULL THEN CONCAT('RESIDENT #', respondent.id)
          ELSE 'UNKNOWN RESPONDENT'
        END as respondent_name,
        con.lupon_panel as panel_members,
        'conciliation' as session_type
      FROM conciliation con
      JOIN complaints c ON con.complaint_id = c.id
      LEFT JOIN residents complainant ON c.complainant_id = complainant.id
      LEFT JOIN residents respondent ON c.respondent_id = respondent.id
      WHERE con.date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND c.status NOT IN ('Settled', 'withdrawn')
        AND (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)
      ORDER BY con.date, con.time
    `, [userId, userId, userId]);

    // Get arbitration schedules (exclude settled cases)
    const [arbitrationSchedules] = await connection.execute(`
      SELECT 
        a.id,
        a.date,
        a.time,
        c.case_title,
        c.id as case_id,
        CASE 
          WHEN complainant.lastname IS NOT NULL AND complainant.firstname IS NOT NULL THEN 
            CONCAT(UPPER(complainant.lastname), ', ', UPPER(complainant.firstname), 
                   CASE WHEN complainant.middlename IS NOT NULL AND complainant.middlename != '' 
                        THEN CONCAT(' ', UPPER(complainant.middlename)) 
                        ELSE '' END)
          WHEN complainant.lastname IS NOT NULL THEN UPPER(complainant.lastname)
          WHEN complainant.firstname IS NOT NULL THEN UPPER(complainant.firstname)
          WHEN complainant.id IS NOT NULL THEN CONCAT('RESIDENT #', complainant.id)
          ELSE 'UNKNOWN COMPLAINANT'
        END as complainant_name,
        CASE 
          WHEN respondent.lastname IS NOT NULL AND respondent.firstname IS NOT NULL THEN 
            CONCAT(UPPER(respondent.lastname), ', ', UPPER(respondent.firstname), 
                   CASE WHEN respondent.middlename IS NOT NULL AND respondent.middlename != '' 
                        THEN CONCAT(' ', UPPER(respondent.middlename)) 
                        ELSE '' END)
          WHEN respondent.lastname IS NOT NULL THEN UPPER(respondent.lastname)
          WHEN respondent.firstname IS NOT NULL THEN UPPER(respondent.firstname)
          WHEN respondent.id IS NOT NULL THEN CONCAT('RESIDENT #', respondent.id)
          ELSE 'UNKNOWN RESPONDENT'
        END as respondent_name,
        a.panel_members,
        'arbitration' as session_type
      FROM arbitration a
      JOIN complaints c ON a.complaint_id = c.id
      LEFT JOIN residents complainant ON c.complainant_id = complainant.id
      LEFT JOIN residents respondent ON c.respondent_id = respondent.id
      WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND a.is_deleted = 0
        AND c.status NOT IN ('Settled', 'withdrawn')
        AND (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)
      ORDER BY a.date, a.time
    `, [userId, userId, userId]);

    // Combine all schedules
    const allSchedules = [
      ...mediationSchedules,
      ...conciliationSchedules,
      ...arbitrationSchedules
    ];

    // Filter to show the current/real-time schedule
    let activeSchedule = null;
    
    if (allSchedules.length > 0) {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      console.log('Date comparison debug:');
      console.log('- Today (server):', today);
      console.log('- Now (server):', now.toISOString());
      if (allSchedules.length > 0) {
        console.log('- First schedule date:', allSchedules[0].date);
        console.log('- First schedule date formatted:', new Date(allSchedules[0].date).toISOString().split('T')[0]);
      }
      
      // Sort all schedules by date/time (earliest first)
      allSchedules.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
      });
      
      // First, check if there's a schedule for today
      const todaySchedules = allSchedules.filter(s => {
        const scheduleDate = new Date(s.date).toISOString().split('T')[0];
        return scheduleDate === today;
      });
      
      if (todaySchedules.length > 0) {
        // If there are schedules today, show the next one or the one happening now
        // Priority: arbitration > conciliation > mediation for today's schedules
        const todayArbitration = todaySchedules.filter(s => s.session_type === 'arbitration');
        const todayConciliation = todaySchedules.filter(s => s.session_type === 'conciliation');
        const todayMediation = todaySchedules.filter(s => s.session_type === 'mediation');
        
        if (todayArbitration.length > 0) {
          activeSchedule = todayArbitration[0];
        } else if (todayConciliation.length > 0) {
          activeSchedule = todayConciliation[0];
        } else if (todayMediation.length > 0) {
          activeSchedule = todayMediation[0];
        }
      } else {
        // If no schedules today, show the next upcoming schedule
        // Priority: arbitration > conciliation > mediation
        const futureSchedules = allSchedules.filter(s => {
          const scheduleDate = new Date(s.date);
          return scheduleDate > now;
        });
        
        if (futureSchedules.length > 0) {
          const arbitrationSchedules = futureSchedules.filter(s => s.session_type === 'arbitration');
          const conciliationSchedules = futureSchedules.filter(s => s.session_type === 'conciliation');
          const mediationSchedules = futureSchedules.filter(s => s.session_type === 'mediation');
          
          if (arbitrationSchedules.length > 0) {
            activeSchedule = arbitrationSchedules[0];
          } else if (conciliationSchedules.length > 0) {
            activeSchedule = conciliationSchedules[0];
          } else if (mediationSchedules.length > 0) {
            activeSchedule = mediationSchedules[0];
          }
        } else {
          // If no future schedules, show the most recent schedule (including yesterday)
          // This handles cases where schedules from yesterday are still relevant
          console.log('No future schedules found, checking recent schedules...');
          if (allSchedules.length > 0) {
            // Sort by date/time descending to get the most recent
            const sortedSchedules = [...allSchedules].sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB - dateA; // Most recent first
            });
            
            // Take the most recent schedule
            activeSchedule = sortedSchedules[0];
            console.log('Selected most recent schedule:', activeSchedule ? `Case ${activeSchedule.case_id}` : 'None');
          }
        }
      }
    }

    // Return only the active schedule (or empty array if none)
    const result = activeSchedule ? [activeSchedule] : [];
    
    // Debug logging
    console.log('getUserSchedules Debug:');
    console.log('- User ID:', userId);
    console.log('- Mediation schedules found:', mediationSchedules.length);
    console.log('- Conciliation schedules found:', conciliationSchedules.length);
    console.log('- Arbitration schedules found:', arbitrationSchedules.length);
    console.log('- All schedules combined:', allSchedules.length);
    console.log('- Active schedule selected:', activeSchedule ? `Case ${activeSchedule.case_id}` : 'None');
    console.log('- Result being returned:', result.length, 'schedules');
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user schedules', error: error.message });
  }
};
