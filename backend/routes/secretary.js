const express = require('express');
const router = express.Router();
const secretaryController = require('../controllers/secretaryController');

router.get('/', secretaryController.getAllSecretaries);
router.post('/', secretaryController.addSecretary);
router.put('/:id', secretaryController.editSecretary);
router.delete('/:id', secretaryController.removeSecretary);

module.exports = router; 