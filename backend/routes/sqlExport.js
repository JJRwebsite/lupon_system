const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { exportDatabaseAsSQL, getDatabaseSummary } = require('../controllers/sqlExportController');

// Export entire database as SQL file
// GET /api/sql-export/download
router.get('/download', verifyToken, exportDatabaseAsSQL);

// Get database summary for display
// GET /api/sql-export/summary
router.get('/summary', verifyToken, getDatabaseSummary);

module.exports = router;
