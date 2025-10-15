const connectDB = require('../config/db');

// Internal helper to optionally use provided connection
async function withConnection(passedConn, fn) {
  if (passedConn) return fn(passedConn);
  const connection = await connectDB();
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

// Create a new notification
async function createNotification(connection, { user_id, complaint_id = null, referral_id = null, type, title, message }) {
  return withConnection(connection, async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO notifications (user_id, complaint_id, referral_id, type, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, complaint_id, referral_id, type, title, message]
    );
    return result.insertId;
  });
}

// Get notifications for a user (latest first)
async function getUserNotifications(connection, userId, limit = 50) {
  return withConnection(connection, async (conn) => {
    const [rows] = await conn.execute(
      `SELECT n.*, c.case_title as complaint_title, r.case_title as referral_title
       FROM notifications n
       LEFT JOIN complaints c ON n.complaint_id = c.id
       LEFT JOIN referrals r ON n.referral_id = r.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  });
}

// Get unread count for a user
async function getUnreadCount(connection, userId) {
  return withConnection(connection, async (conn) => {
    const [rows] = await conn.execute(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return rows[0]?.unread_count || 0;
  });
}

// Mark a notification as read
async function markAsRead(connection, notificationId) {
  return withConnection(connection, async (conn) => {
    await conn.execute(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [notificationId]);
    return true;
  });
}

// Mark all notifications as read for a user
async function markAllAsRead(connection, userId) {
  return withConnection(connection, async (conn) => {
    await conn.execute(`UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, [userId]);
    return true;
  });
}

// Notify users about case events
async function notifyUsersAboutCase(connection, complaintId, type, customTitle = null, customMessage = null) {
  return withConnection(connection, async (conn) => {
    // Fetch complaint with residents & users
    const [rows] = await conn.execute(
      `SELECT c.id, c.case_title, c.status, c.user_id,
              comp.id AS complainant_resident_id, comp.user_id AS complainant_user_id,
              resp.id AS respondent_resident_id, resp.user_id AS respondent_user_id
       FROM complaints c
       LEFT JOIN residents comp ON c.complainant_id = comp.id
       LEFT JOIN residents resp ON c.respondent_id = resp.id
       WHERE c.id = ?`,
      [complaintId]
    );
    if (rows.length === 0) return false;
    const complaint = rows[0];

    // Build recipients: case owner + linked residents' users (if any)
    const recipients = new Set();
    if (complaint.user_id) recipients.add(complaint.user_id);
    if (complaint.complainant_user_id) recipients.add(complaint.complainant_user_id);
    if (complaint.respondent_user_id) recipients.add(complaint.respondent_user_id);

    const title = customTitle || `Case Update`;
    const message = customMessage || `Your case "${complaint.case_title}" has an update: ${type.replace(/_/g, ' ')}.`;

    for (const user_id of recipients) {
      await createNotification(conn, { user_id, complaint_id: complaintId, type, title, message });
    }
    return true;
  });
}

// Notify users about referral events
async function notifyUsersAboutReferral(connection, referralId, originalComplaintId) {
  return withConnection(connection, async (conn) => {
    const [rows] = await conn.execute(
      `SELECT r.id, r.case_title, r.referred_to,
              r.complainant_id, r.respondent_id,
              comp.user_id AS complainant_user_id,
              resp.user_id AS respondent_user_id
       FROM referrals r
       LEFT JOIN residents comp ON r.complainant_id = comp.id
       LEFT JOIN residents resp ON r.respondent_id = resp.id
       WHERE r.id = ?`,
      [referralId]
    );
    if (rows.length === 0) return false;
    const ref = rows[0];

    const recipients = new Set();
    if (ref.complainant_user_id) recipients.add(ref.complainant_user_id);
    if (ref.respondent_user_id) recipients.add(ref.respondent_user_id);

    const title = 'Case Transferred';
    const message = `Your case "${ref.case_title}" has been transferred to ${ref.referred_to}.`;

    for (const user_id of recipients) {
      await createNotification(conn, { user_id, complaint_id: originalComplaintId || null, referral_id: referralId, type: 'case_transferred', title, message });
    }
    return true;
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  notifyUsersAboutCase,
  notifyUsersAboutReferral,
};
