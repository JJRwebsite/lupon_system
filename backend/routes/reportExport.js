const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { exportReportAsExcel, exportReportAsPDF } = require('../controllers/reportExportController');

// Export report as Excel file
router.post('/excel', verifyToken, exportReportAsExcel);

// Export report as PDF file
router.post('/pdf', verifyToken, exportReportAsPDF);

module.exports = router;
