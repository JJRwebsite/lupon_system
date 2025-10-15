const {
  createResident: modelCreateResident,
  getAllResidents: modelGetAllResidents,
  searchResidents: modelSearchResidents,
  getResidentById: modelGetResidentById,
  updateResident: modelUpdateResident,
  findOrCreateResidentWithConnection,
} = require('../models/residentsModel');

// Create a new resident
exports.createResident = async (req, res) => {
  try {
    const result = await modelCreateResident(req.body);
    if (result.existed) {
      return res.json({ success: true, resident_id: result.resident_id, message: 'Resident already exists' });
    }
    return res.json({ success: true, resident_id: result.resident_id, message: 'Resident created successfully' });
  } catch (error) {
    console.error('Error creating resident:', error);
    res.status(500).json({ success: false, message: 'Failed to create resident', error: error.message });
  }
};

// Get all residents
exports.getAllResidents = async (req, res) => {
  try {
    const residents = await modelGetAllResidents();
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch residents', error: error.message });
  }
};

// Search residents by name
exports.searchResidents = async (req, res) => {
  try {
    const q = req.query.query || '';
    const residents = await modelSearchResidents(q);
    res.json(residents);
  } catch (error) {
    console.error('Error searching residents:', error);
    res.status(500).json({ success: false, message: 'Failed to search residents', error: error.message });
  }
};

// Get resident by ID
exports.getResidentById = async (req, res) => {
  try {
    const resident = await modelGetResidentById(req.params.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    res.json(resident);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resident', error: error.message });
  }
};

// Update resident
exports.updateResident = async (req, res) => {
  try {
    await modelUpdateResident(req.params.id, req.body);
    res.json({ success: true, message: 'Resident updated successfully' });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ success: false, message: 'Failed to update resident', error: error.message });
  }
};

// Helper function to find or create resident (kept for backward compatibility)
exports.findOrCreateResident = async (connection, residentData) => {
  return findOrCreateResidentWithConnection(connection, residentData);
};
