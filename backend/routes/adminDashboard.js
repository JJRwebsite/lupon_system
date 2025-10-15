const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Admin dashboard statistics (protected with JWT and admin role)
router.get('/stats', verifyToken, requireRole(['admin', 'secretary']), adminDashboardController.getAdminStats);

// Admin analytics (protected with JWT and admin role)
router.get('/analytics', verifyToken, requireRole(['admin', 'secretary']), adminDashboardController.getAdminAnalytics);

// Admin demographics (protected with JWT and admin role)
router.get('/demographics', verifyToken, requireRole(['admin', 'secretary']), adminDashboardController.getDemographics);

module.exports = router;
