const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController');

router.get('/', membersController.getAllMembers);
router.post('/', membersController.addMember);
router.put('/:id', membersController.editMember);
router.delete('/:id', membersController.removeMember);

module.exports = router; 