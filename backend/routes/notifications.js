const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { verifyToken } = require('../middleware/auth');

// Get all notifications for current user (protected with JWT)
router.get('/', verifyToken, notificationsController.getUserNotifications);

// Get unread notification count for current user (protected with JWT)
router.get('/unread-count', verifyToken, notificationsController.getUnreadCount);

// Mark specific notification as read (protected with JWT)
router.put('/:notificationId/read', verifyToken, notificationsController.markAsRead);

// Mark all notifications as read for current user (protected with JWT)
router.put('/mark-all-read', verifyToken, notificationsController.markAllAsRead);

module.exports = router;
