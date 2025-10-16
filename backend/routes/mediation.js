const express = require('express');
const router = express.Router();
const mediationController = require('../controllers/mediationController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/mediation/')
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'mediation-' + uniqueSuffix + path.extname(file.originalname));
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

router.post('/schedule', mediationController.setMediationSchedule);
router.get('/', mediationController.getAllMediations);
router.get('/available-slots/:date', mediationController.getAvailableSlots);
router.post('/session', upload.array('photos'), mediationController.saveMediationSession);
router.put('/session/:id/soft-delete', mediationController.softDeleteSession);
router.post('/reschedule', mediationController.rescheduleMediation);
router.post('/cleanup-documentation', mediationController.cleanupDocumentationIds);

module.exports = router;