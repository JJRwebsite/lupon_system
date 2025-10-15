const express = require('express');
const router = express.Router();
const conciliationController = require('../controllers/conciliationController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/conciliation/')
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'conciliation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const { verifyToken } = require('../middleware/auth');

// Set a new conciliation schedule
router.post('/schedule', conciliationController.setConciliationSchedule);

// Get all conciliation records (with joined info)
router.get('/', conciliationController.getAllConciliations);

// Get available slots for a specific date
router.get('/available-slots/:date', conciliationController.getAvailableSlots);

// Save conciliation session (minutes, documentation)
router.post('/session', upload.array('photos'), conciliationController.saveConciliationSession);

// Reschedule conciliation session
router.post('/reschedule', conciliationController.rescheduleConciliation);

// Soft delete conciliation session
router.delete('/session/:id', conciliationController.softDeleteSession);

router.get('/user-schedules', verifyToken, conciliationController.getUserConciliationSchedules);

module.exports = router; 