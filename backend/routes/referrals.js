const express = require('express');
const router = express.Router();
const referralsController = require('../controllers/referralsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Transfer complaint to referrals (requires authentication)
router.post('/transfer/:complaintId', verifyToken, referralsController.transferComplaint);

// Get all referrals (requires authentication)
router.get('/', verifyToken, referralsController.getReferrals);

// Update referral status (requires authentication)
router.put('/:referralId/status', verifyToken, referralsController.updateReferralStatus);

// Delete referral (requires authentication)
router.delete('/:referralId', verifyToken, referralsController.deleteReferral);

module.exports = router;
