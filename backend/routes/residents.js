const express = require('express');
const router = express.Router();
const residentsController = require('../controllers/residentsController');

// Create a new resident
router.post('/', residentsController.createResident);

// Get all residents
router.get('/', residentsController.getAllResidents);

// Search residents
router.get('/search', residentsController.searchResidents);

// Get resident by ID
router.get('/:id', residentsController.getResidentById);

// Update resident
router.put('/:id', residentsController.updateResident);

module.exports = router;
