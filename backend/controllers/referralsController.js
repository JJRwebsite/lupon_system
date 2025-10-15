const connectDB = require('../config/db');
const { notifyUsersAboutReferral } = require('./notificationsController');
const {
  createReferralsTableDb,
  transferComplaintDb,
  listReferralsDetailed,
  updateReferralStatusDb,
  deleteReferralDb,
} = require('../models/referralsModel');

// Create referrals table if it doesn't exist
exports.createReferralsTable = async () => {
  const connection = await connectDB();
  try {
    await createReferralsTableDb(connection);
    console.log('Referrals table created/updated successfully');
  } catch (error) {
    console.error('Error creating referrals table:', error);
  } finally {
    await connection.end();
  }
};

// Transfer complaint to referrals
exports.transferComplaint = async (req, res) => {
  const { complaintId } = req.params;
  const { referred_to, referral_reason } = req.body;
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const userId = req.user.id;
  const connection = await connectDB();
  try {
    const referral_id = await transferComplaintDb(connection, { complaintId, referred_to, referral_reason, referred_by: userId });
    await notifyUsersAboutReferral(referral_id, complaintId);
    res.json({ success: true, message: 'Complaint transferred successfully', referral_id });
  } catch (error) {
    console.error('Error transferring complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to transfer complaint' });
  } finally {
    await connection.end();
  }
};

// Get all referrals
exports.getReferrals = async (req, res) => {
  const connection = await connectDB();
  try {
    const formattedReferrals = await listReferralsDetailed(connection);
    res.json(formattedReferrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  } finally {
    await connection.end();
  }
};

// Update referral status
exports.updateReferralStatus = async (req, res) => {
  const { referralId } = req.params;
  const { status } = req.body;

  const connection = await connectDB();
  try {
    await updateReferralStatusDb(connection, referralId, status);
    res.json({ success: true, message: 'Referral status updated successfully' });
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ error: 'Failed to update referral status' });
  } finally {
    await connection.end();
  }
};

// Delete referral
exports.deleteReferral = async (req, res) => {
  const { referralId } = req.params;

  const connection = await connectDB();
  try {
    const ok = await deleteReferralDb(connection, referralId);
    if (!ok) return res.status(404).json({ error: 'Referral not found' });
    res.json({ success: true, message: 'Referral deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({ error: 'Failed to delete referral' });
  } finally {
    await connection.end();
  }
};
