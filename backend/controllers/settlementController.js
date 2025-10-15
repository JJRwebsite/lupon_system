const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');
const {
  ensureSettlementTable,
  listSettlementsDetailed,
  insertSettlement,
  getSettlementByIdDetailed,
  updateSettlementById,
  deleteSettlementById,
} = require('../models/settlementModel');

// Get all settlements with case details
const getSettlements = async (req, res) => {
  const connection = await connectDB();
  try {
    await ensureSettlementTable(connection);
    const settlements = await listSettlementsDetailed(connection);
    res.json(Array.isArray(settlements) ? settlements : []);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.json([]);
  } finally {
    await connection.end();
  }
};

// Create a new settlement
const createSettlement = async (req, res) => {
  const connection = await connectDB();
  try {
    const { complaint_id, settlement_type, settlement_date, agreements, remarks } = req.body;
    if (!complaint_id || !settlement_type || !settlement_date || !agreements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await ensureSettlementTable(connection);
    const insertId = await insertSettlement(connection, { complaint_id, settlement_type, settlement_date, agreements, remarks });
    // Update complaint status and notify
    await connection.execute('UPDATE complaints SET status = ? WHERE id = ?', ['Settled', complaint_id]);
    await notifyUsersAboutCase(complaint_id, 'case_settled');
    res.json({ message: 'Settlement created successfully', settlement_id: insertId });
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  } finally {
    await connection.end();
  }
};

// Get settlement by ID
const getSettlementById = async (req, res) => {
  const connection = await connectDB();
  try {
    const { id } = req.params;
    await ensureSettlementTable(connection);
    const settlement = await getSettlementByIdDetailed(connection, id);
    if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
    res.json(settlement);
  } catch (error) {
    console.error('Error fetching settlement:', error);
    res.status(500).json({ error: 'Failed to fetch settlement' });
  } finally {
    await connection.end();
  }
};

// Update settlement
const updateSettlement = async (req, res) => {
  const connection = await connectDB();
  try {
    const { id } = req.params;
    const { settlement_date, agreements, remarks } = req.body;
    const ok = await updateSettlementById(connection, { id, settlement_date, agreements, remarks });
    if (!ok) return res.status(404).json({ error: 'Settlement not found' });
    res.json({ message: 'Settlement updated successfully' });
  } catch (error) {
    console.error('Error updating settlement:', error);
    res.status(500).json({ error: 'Failed to update settlement' });
  } finally {
    await connection.end();
  }
};

// Delete settlement
const deleteSettlement = async (req, res) => {
  const connection = await connectDB();
  try {
    const { id } = req.params;
    const ok = await deleteSettlementById(connection, id);
    if (!ok) return res.status(404).json({ error: 'Settlement not found' });
    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).json({ error: 'Failed to delete settlement' });
  } finally {
    await connection.end();
  }
};

module.exports = {
  getSettlements,
  createSettlement,
  getSettlementById,
  updateSettlement,
  deleteSettlement
};
