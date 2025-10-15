const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const arbitrationController = require('../controllers/arbitrationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/arbitration/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/arbitration/schedule
// @desc    Set arbitration schedule
// @access  Private
router.post('/schedule', arbitrationController.setArbitrationSchedule);

// @route   GET /api/arbitration
// @desc    Get all arbitrations
// @access  Private
router.get('/', arbitrationController.getAllArbitrations);

// @route   POST /api/arbitration/save-session
// @desc    Save arbitration session with minutes and documentation
// @access  Private
router.post('/save-session', upload.array('documentation', 10), arbitrationController.saveArbitrationSession);

// @route   DELETE /api/arbitration/session/:id
// @desc    Soft delete arbitration session
// @access  Private
router.delete('/session/:id', arbitrationController.softDeleteSession);

// @route   POST /api/arbitration/reschedule
// @desc    Reschedule arbitration session
// @access  Private
router.post('/reschedule', arbitrationController.rescheduleArbitration);

// @route   GET /api/arbitration/case/:complaint_id
// @desc    Get arbitration data by case ID for minutes validation
// @access  Private
router.get('/case/:complaint_id', arbitrationController.getArbitrationByCase);

module.exports = router;
