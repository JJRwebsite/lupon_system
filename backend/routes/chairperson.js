const express = require('express');
const router = express.Router();
const chairpersonController = require('../controllers/chairpersonController');

router.get('/', chairpersonController.getAllChairpersons);
router.post('/', chairpersonController.addChairperson);
router.put('/:id', chairpersonController.editChairperson);
router.delete('/:id', chairpersonController.removeChairperson);

module.exports = router; 