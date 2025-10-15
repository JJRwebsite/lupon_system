const express = require('express');
const router = express.Router();
const multer = require('multer');
const complaintsController = require('../controllers/complaintsController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for handling FormData (no file uploads for basic complaints)
const upload = multer();

router.post('/', upload.none(), complaintsController.createComplaint);
router.get('/', complaintsController.getComplaints);
router.get('/pending_cases', complaintsController.getPendingCases);
router.get('/pending_cases_count', complaintsController.getPendingCasesCount);

router.get('/test-structure', complaintsController.checkDatabaseStructure);
router.put('/:id', complaintsController.updateComplaint);
router.put('/:id/withdraw', complaintsController.withdrawComplaint);
router.get('/withdrawn', complaintsController.getWithdrawnComplaints);
router.put('/:id/priority', complaintsController.updatePriority);
router.get('/user-complaints', verifyToken, complaintsController.getUserComplaints);
router.get('/user-schedules', verifyToken, complaintsController.getUserSchedules);

module.exports = router; 