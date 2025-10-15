const express = require('express');
const router = express.Router();
const { getAllSystemData, getBackupSummary } = require('../controllers/backupController');
const { verifyToken } = require('../middleware/auth');

// Get full database backup
router.get('/full', verifyToken, getAllSystemData);

// Get backup summary
router.get('/summary', verifyToken, getBackupSummary);

module.exports = router;
