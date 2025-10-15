const connectDB = require('../config/db');
const {
  createNotification: createNotificationModel,
  getUserNotifications: getUserNotificationsModel,
  getUnreadCount: getUnreadCountModel,
  markAsRead: markAsReadModel,
  markAllAsRead: markAllAsReadModel,
  notifyUsersAboutCase: notifyUsersAboutCaseModel,
  notifyUsersAboutReferral: notifyUsersAboutReferralModel,
} = require('../models/notificationsModel');

// Create a new notification
exports.createNotification = async (userId, complaintId, referralId, type, title, message) => {
  const connection = await connectDB();
  try {
    const insertId = await createNotificationModel(connection, {
      user_id: userId,
      complaint_id: complaintId,
      referral_id: referralId,
      type,
      title,
      message,
    });
    return insertId;
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userId = req.user.id;
    const notifications = await getUserNotificationsModel(connection, userId);
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userId = req.user.id;
    const unread_count = await getUnreadCountModel(connection, userId);
    res.json({ success: true, unread_count });
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

    await markAsReadModel(connection, notificationId);
    res.json({ success: true });
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
    await markAllAsReadModel(connection, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  } finally {
    await connection.end();
  }
};

// Helper function to notify users about case status changes
exports.notifyUsersAboutCase = async (complaintId, type, customTitle = null, customMessage = null) => {
  const connection = await connectDB();
  try {
    await notifyUsersAboutCaseModel(connection, complaintId, type, customTitle, customMessage);
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
    await notifyUsersAboutReferralModel(connection, referralId, originalComplaintId);
  } catch (error) {
    console.error('Error notifying users about referral:', error);
  } finally {
    await connection.end();
  }
};
