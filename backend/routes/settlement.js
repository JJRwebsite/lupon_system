const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');

// GET /api/settlement - Get all settlements
router.get('/', settlementController.getSettlements);

// POST /api/settlement - Create new settlement
router.post('/', settlementController.createSettlement);

// GET /api/settlement/:id - Get settlement by ID
router.get('/:id', settlementController.getSettlementById);

// PUT /api/settlement/:id - Update settlement
router.put('/:id', settlementController.updateSettlement);

// DELETE /api/settlement/:id - Delete settlement
router.delete('/:id', settlementController.deleteSettlement);

module.exports = router;
