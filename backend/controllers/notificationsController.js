const connectDB = require('../config/db');

// Create a new notification
exports.createNotification = async (userId, complaintId, referralId, type, title, message) => {
  const connection = await connectDB();
  try {
    console.log(`Attempting to create notification:`, {
      userId,
      complaintId,
      referralId,
      type,
      title,
      message: message?.substring(0, 50) + '...'
    });
    
    const [result] = await connection.execute(`
      INSERT INTO notifications (user_id, complaint_id, referral_id, type, title, message) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, complaintId, referralId, type, title, message]);
    
    console.log(`✅ Notification created successfully for user ${userId}: ${title} (ID: ${result.insertId})`);
    return result.insertId;
  } catch (error) {
    console.error(`❌ Error creating notification for user ${userId}, complaint ${complaintId}:`, {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      params: { userId, complaintId, referralId, type, title }
    });
    throw error;
  } finally {
    await connection.end();
  }
};

// Test endpoint: create a test notification for the currently authenticated user
// Useful to verify NotificationBell quickly without triggering real events
exports.testCreateForCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userId = req.user.id;
    const title = 'Test Notification';
    const message = 'This is a test user notification created via /api/notifications/test.';

    const newId = await exports.createNotification(
      userId,
      null, // complaint_id
      null, // referral_id
      'case_settled', // reuse existing enum value to avoid schema change
      title,
      message
    );

    return res.json({ success: true, id: newId, message: 'Test notification created for current user.' });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to create test notification' });
  }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  const connection = await connectDB();
  try {
    // Get user ID from JWT token (provided by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.user.id;

    const [notifications] = await connection.execute(`
      SELECT n.*, 
             c.case_title as complaint_title,
             r.case_title as referral_title
      FROM notifications n
      LEFT JOIN complaints c ON n.complaint_id = c.id
      LEFT JOIN referrals r ON n.referral_id = r.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  } finally {
    await connection.end();
  }
};

// Get unread notification count for a user
exports.getUnreadCount = async (req, res) => {
  const connection = await connectDB();
  try {
    // Get user ID from JWT token (provided by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.user.id;

    const [result] = await connection.execute(`
      SELECT COUNT(*) as unread_count 
      FROM notifications 
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);

    res.json({ success: true, unread_count: result[0].unread_count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  } finally {
    await connection.end();
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const connection = await connectDB();
  try {
    // Get user ID from JWT token (provided by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.user.id;
    console.log(`📝 Marking notification ${notificationId} as read for user ${userId}`);
    
    // First check if notification exists and belongs to user
    const [checkResult] = await connection.execute(
      'SELECT id, user_id, is_read, title FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    if (checkResult.length === 0) {
      console.log(`❌ Notification ${notificationId} not found`);
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    const notification = checkResult[0];
    console.log(`📋 Found notification:`, {
      id: notification.id,
      user_id: notification.user_id,
      is_read: notification.is_read,
      title: notification.title,
      requestingUserId: userId
    });
    
    if (notification.user_id !== userId) {
      console.log(`❌ Access denied: notification belongs to user ${notification.user_id}, but user ${userId} is trying to access it`);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [updateResult] = await connection.execute(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
    
    console.log(`🔄 UPDATE result:`, {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
      info: updateResult.info
    });
    
    if (updateResult.affectedRows === 0) {
      console.log(`⚠️ No rows updated - notification may not exist or not belong to user`);
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }
    
    console.log(`✅ Successfully marked notification ${notificationId} as read for user ${userId}`);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  } finally {
    await connection.end();
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  const connection = await connectDB();
  try {
    // Get user ID from JWT token (provided by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.user.id;

    await connection.execute(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  } finally {
    await connection.end();
  }
};

// Helper function to notify users about case status changes
exports.notifyUsersAboutCase = async (complaintId, type, customTitle = null, customMessage = null) => {
  const connection = await connectDB();
  try {
    console.log(`🔔 Starting notification process for complaint ${complaintId}, type: ${type}`);
    
    // Get complaint details and involved users
    const [complaints] = await connection.execute(`
      SELECT c.*, 
             TRIM(CONCAT(
               UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
               CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
             )) as complainant_name,
             TRIM(CONCAT(
               UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
               CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
             )) as respondent_name,
             comp.user_id AS complainant_user_id,
             resp.user_id AS respondent_user_id
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      WHERE c.id = ?
    `, [complaintId]);

    if (complaints.length === 0) {
      console.log(`❌ No complaint found with ID ${complaintId}`);
      return;
    }

    const complaint = complaints[0];
    console.log(`📋 Found complaint: ${complaint.case_title}, user_id: ${complaint.user_id}, complainant: ${complaint.complainant_name}, respondent: ${complaint.respondent_name}`);
    
    // Primary method: Use the user_id from complaints table (the user who created the complaint)
    const usersToNotify = [];
    
    if (complaint.user_id) {
      // Verify the user exists
      const [userExists] = await connection.execute(
        'SELECT id, first_name, last_name FROM users WHERE id = ?',
        [complaint.user_id]
      );
      
      if (userExists.length > 0) {
        usersToNotify.push(complaint.user_id);
        console.log(`✅ Found complaint creator user: ${userExists[0].first_name} ${userExists[0].last_name} (ID: ${complaint.user_id})`);
      } else {
        console.log(`❌ User ID ${complaint.user_id} not found in users table`);
      }
    } else {
      console.log(`⚠️ No user_id found for complaint ${complaintId}`);
    }
    
    // Also notify complainant/respondent user accounts if linked via residents.user_id
    const additionalUsers = [];
    if (complaint.complainant_user_id) {
      if (!usersToNotify.includes(complaint.complainant_user_id)) {
        additionalUsers.push(complaint.complainant_user_id);
        console.log(`🔍 Found complainant linked user via residents.user_id: ${complaint.complainant_user_id}`);
      }
    } else {
      console.log('ℹ️ No complainant_user_id linked for this complaint');
    }
    if (complaint.respondent_user_id) {
      if (!usersToNotify.includes(complaint.respondent_user_id) && !additionalUsers.includes(complaint.respondent_user_id)) {
        additionalUsers.push(complaint.respondent_user_id);
        console.log(`🔍 Found respondent linked user via residents.user_id: ${complaint.respondent_user_id}`);
      }
    } else {
      console.log('ℹ️ No respondent_user_id linked for this complaint');
    }
    // De-duplicate and add
    usersToNotify.push(...additionalUsers.filter((id) => !usersToNotify.includes(id)));

    // Generate notification content based on type
    let title, message;
    
    if (customTitle && customMessage) {
      title = customTitle;
      message = customMessage;
    } else {
      switch (type) {
        case 'case_accepted':
          title = 'Case Accepted';
          message = `Your complaint "${complaint.case_title}" has been officially accepted and is now being processed.`;
          break;
        case 'mediation_scheduled':
          title = 'Mediation Scheduled';
          message = `Your case "${complaint.case_title}" has been scheduled for mediation. Please check your dashboard for details.`;
          break;
        case 'conciliation_scheduled':
          title = 'Conciliation Scheduled';
          message = `Your case "${complaint.case_title}" has been scheduled for conciliation. Please check your dashboard for details.`;
          break;
        case 'arbitration_scheduled':
          title = 'Arbitration Scheduled';
          message = `Your case "${complaint.case_title}" has been scheduled for arbitration. Please check your dashboard for details.`;
          break;
        case 'case_settled':
          title = 'Case Settled';
          message = `Your case "${complaint.case_title}" has been successfully settled.`;
          break;
        case 'case_transferred':
          title = 'Case Referred';
          message = `Your case "${complaint.case_title}" has been referred to another agency for further processing.`;
          break;
        case 'session_rescheduled':
          title = 'Session Rescheduled';
          message = `A session for your case "${complaint.case_title}" has been rescheduled. Please check your dashboard for the new schedule.`;
          break;
        case 'case_withdrawn':
          title = 'Case Withdrawn';
          message = `The case "${complaint.case_title}" has been withdrawn.`;
          break;
        default:
          title = 'Case Update';
          message = `There has been an update to your case "${complaint.case_title}".`;
      }
    }

    // Create notifications for all identified users
    console.log(`📬 Creating ${usersToNotify.length} notifications for complaint ${complaintId}`);
    
    if (usersToNotify.length === 0) {
      console.log(`⚠️ No users found to notify for complaint ${complaintId}`);
      return;
    }
    
    for (const userId of usersToNotify) {
      try {
        console.log(`📧 Creating notification for user ID: ${userId}`);
        await this.createNotification(userId, complaintId, null, type, title, message);
        console.log(`✅ Notification created successfully for user ${userId}`);
      } catch (notificationError) {
        console.error(`❌ Failed to create notification for user ${userId}:`, notificationError);
      }
    }

    console.log(`🎯 Notification process completed for complaint ${complaintId}. Created notifications for ${usersToNotify.length} users.`);
  } catch (error) {
    console.error('Error notifying users about case:', error);
  } finally {
    await connection.end();
  }
};

// Helper function to notify users about referral
exports.notifyUsersAboutReferral = async (referralId, originalComplaintId) => {
  const connection = await connectDB();
  try {
    console.log(`📬 Starting notification process for referral ${referralId}`);
    
    // Get referral details with resident information
    const [referrals] = await connection.execute(`
      SELECT r.*, 
             TRIM(CONCAT(
               UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
               CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
             )) as complainant_name,
             TRIM(CONCAT(
               UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
               CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
             )) as respondent_name
      FROM referrals r
      LEFT JOIN residents comp ON r.complainant_id = comp.id
      LEFT JOIN residents resp ON r.respondent_id = resp.id
      WHERE r.id = ?
    `, [referralId]);

    if (referrals.length === 0) {
      console.log(`❌ No referral found with ID ${referralId}`);
      return;
    }

    const referral = referrals[0];
    console.log(`📋 Found referral: ${referral.case_title} -> ${referral.referred_to}`);
    
    // Find user accounts linked to complainant and respondent residents
    const usersToNotify = [];
    
    // Find complainant user account using user_id link
    if (referral.complainant_id) {
      console.log(`🔍 Looking for complainant user account for resident ID ${referral.complainant_id} (${referral.complainant_name})`);
      
      const [complainantUsers] = await connection.execute(`
        SELECT u.id, u.first_name, u.middle_name, u.last_name,
               CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.last_name) as full_name
        FROM users u 
        INNER JOIN residents r ON r.user_id = u.id
        WHERE r.id = ?
      `, [referral.complainant_id]);
      
      if (complainantUsers.length > 0) {
        usersToNotify.push({
          userId: complainantUsers[0].id,
          name: `${complainantUsers[0].first_name} ${complainantUsers[0].last_name}`,
          role: 'complainant'
        });
        console.log(`👤 Found complainant user: ${complainantUsers[0].first_name} ${complainantUsers[0].last_name} (ID: ${complainantUsers[0].id})`);
      } else {
        console.log(`⚠️ No user account linked for complainant resident ID ${referral.complainant_id}: ${referral.complainant_name}`);
      }
    }
    
    // Find respondent user account using user_id link
    if (referral.respondent_id) {
      console.log(`🔍 Looking for respondent user account for resident ID ${referral.respondent_id} (${referral.respondent_name})`);
      
      const [respondentUsers] = await connection.execute(`
        SELECT u.id, u.first_name, u.middle_name, u.last_name,
               CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.last_name) as full_name
        FROM users u 
        INNER JOIN residents r ON r.user_id = u.id
        WHERE r.id = ?
      `, [referral.respondent_id]);
      
      if (respondentUsers.length > 0) {
        usersToNotify.push({
          userId: respondentUsers[0].id,
          name: `${respondentUsers[0].first_name} ${respondentUsers[0].last_name}`,
          role: 'respondent'
        });
        console.log(`👤 Found respondent user: ${respondentUsers[0].first_name} ${respondentUsers[0].last_name} (ID: ${respondentUsers[0].id})`);
      } else {
        console.log(`⚠️ No user account linked for respondent resident ID ${referral.respondent_id}: ${referral.respondent_name}`);
      }
    }

    if (usersToNotify.length === 0) {
      console.log(`⚠️ No users found to notify for referral ${referralId}`);
      return;
    }

    const title = 'Case Transferred';
    const message = `Your case "${referral.case_title}" has been transferred to ${referral.referred_to} for further processing. You may need to follow up directly with the receiving agency.`;

    // Create notifications for all identified users
    console.log(`📧 Creating ${usersToNotify.length} notifications for referral ${referralId}`);
    
    for (const user of usersToNotify) {
      try {
        await this.createNotification(
          user.userId, 
          null, // no complaint_id since it's transferred
          referralId, 
          'case_transferred', 
          title, 
          message
        );
        console.log(`✅ Notification created for ${user.role}: ${user.name} (ID: ${user.userId})`);
      } catch (notificationError) {
        console.error(`❌ Failed to create notification for user ${user.userId}:`, notificationError);
      }
    }

    console.log(`🎯 Referral notification process completed. Created notifications for ${usersToNotify.length} users.`);
  } catch (error) {
    console.error('❌ Error notifying users about referral:', error);
  } finally {
    await connection.end();
  }
};
