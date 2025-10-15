const express = require('express');
const router = express.Router();
const userDashboardController = require('../controllers/userDashboardController');
const { verifyToken } = require('../middleware/auth');

// Get user dashboard statistics (protected with JWT)
router.get('/stats', verifyToken, userDashboardController.getUserStats);

// Get user schedules (protected with JWT)
router.get('/schedules', verifyToken, userDashboardController.getUserSchedules);

module.exports = router;
