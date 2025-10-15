const connectDB = require('../config/db');
const { findOrCreateResident } = require('./residentsController');
const { notifyUsersAboutCase, createNotification } = require('./notificationsController');
const { 
  getNextComplaintId, 
  insertComplaint, 
  getAdminUsers,
  listComplaintsDetailed,
  listPendingComplaintsDetailed,
  getPendingCountAndLatest,
  updateComplaintFields,
  updatePriorityById,
  listUserComplaintsDetailed,
  listUserSchedulesDetailed,
  withdrawComplaintStatus,
  listWithdrawnComplaintsDetailed,
} = require('../models/complaintsModel');

exports.addStatusColumn = async () => {
  const connection = await connectDB();
  try {
    // Check if status column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'complaints' 
      AND COLUMN_NAME = 'status'
    `);

    if (columns.length === 0) {
      // Add status column if it doesn't exist
      await connection.execute(`
        ALTER TABLE complaints 
        ADD COLUMN status VARCHAR(50) DEFAULT 'pending'
      `);
    }
  } catch (error) {
    console.error('Error adding status column:', error);
  } finally {
    await connection.end();
  }
};

// Withdraw a complaint (set status to 'withdrawn' and date_withdrawn)
exports.withdrawComplaint = async (req, res) => {
  const connection = await connectDB();
  try {
    const complaintId = req.params.id || req.body.complaintId;
    if (!complaintId) {
      return res.status(400).json({ success: false, message: 'Missing complaint ID' });
    }
    await withdrawComplaintStatus(connection, complaintId);
    await notifyUsersAboutCase(complaintId, 'case_withdrawn');
    res.json({ success: true, message: 'Complaint withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw complaint', error: error.message });
  } finally {
    await connection.end();
  }
};

exports.createComplaint = async (req, res) => {
  // Check if req.body exists
  if (!req.body) {
    console.error('Request body is undefined');
    return res.status(400).json({ success: false, message: 'Request body is missing' });
  }
  
  const {
    case_title,
    case_description,
    nature_of_case,
    relief_description,
    user_id,
  } = req.body;
  
  // Parse JSON strings from FormData
  let complainant = null;
  let respondent = null;
  let witness = null;
  
  try {
    complainant = req.body.complainant ? JSON.parse(req.body.complainant) : null;
    respondent = req.body.respondent ? JSON.parse(req.body.respondent) : null;
    witness = req.body.witness ? JSON.parse(req.body.witness) : null;
  } catch (error) {
    console.error('Error parsing party data:', error);
    return res.status(400).json({ success: false, message: 'Invalid party data format' });
  }
  


  const connection = await connectDB();
  try {
    await connection.beginTransaction();
    
    // Handle single complainant
    let complainant_id = null;
    if (complainant && (complainant.name || complainant.firstname || complainant.lastname || complainant.id)) {
      // If complainant has an ID, use it directly (existing resident)
      if (complainant.id) {
        complainant_id = complainant.id;
      } else {
        // Create new resident using the new structure
        complainant_id = await findOrCreateResident(connection, complainant);
      }
    }
    
    // Handle single respondent
    let respondent_id = null;
    if (respondent && (respondent.name || respondent.firstname || respondent.lastname || respondent.id)) {
      // If respondent has an ID, use it directly (existing resident)
      if (respondent.id) {
        respondent_id = respondent.id;
      } else {
        // Create new resident using the new structure
        respondent_id = await findOrCreateResident(connection, respondent);
      }
    }
    
    // Handle single witness (optional)
    let witness_id = null;
    if (witness && (witness.name || witness.firstname || witness.lastname || witness.id)) {
      // If witness has an ID, use it directly (existing resident)
      if (witness.id) {
        witness_id = witness.id;
      } else {
        // Create new resident using the new structure
        witness_id = await findOrCreateResident(connection, witness);
      }
    }
    
    // Validate that complainant and respondent are different people
    if (complainant_id && respondent_id && complainant_id === respondent_id) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Complainant and respondent cannot be the same person' 
      });
    }
    
    // Validate that complainant and witness are different people
    if (complainant_id && witness_id && complainant_id === witness_id) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Complainant and witness cannot be the same person' 
      });
    }
    
    // Validate that respondent and witness are different people
    if (respondent_id && witness_id && respondent_id === witness_id) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Respondent and witness cannot be the same person' 
      });
    }
    
    // Generate year-based unique case ID (e.g., 2025001, 2025002, etc.)
    const nextId = await getNextComplaintId(connection);
    
    // Insert complaint with explicit ID to reuse deleted IDs
    
    // All new cases should have status 'pending' to appear in pending cases page
    const caseStatus = 'pending';
    
    await insertComplaint(connection, {
      id: nextId,
      case_title,
      case_description,
      nature_of_case,
      relief_description,
      complainant_id,
      respondent_id,
      witness_id,
      status: caseStatus,
      user_id,
    });
    

    
    await connection.commit();
    

    
    // Create notifications for admins about new case for approval
    try {
      // Get all admin and secretary users
      const adminUsers = await getAdminUsers(connection);
      
      // Create notification for each admin/secretary
      const notificationPromises = adminUsers.map(user =>
        createNotification(
          user.id,
          nextId,
          null, // referralId
          'case_for_approval',
          'New Case for Approval',
          `A new complaint (Case #${nextId}) has been filed and requires approval. Please review the case details in the Cases for Approval section.`
        )
      );
      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error('Error creating admin notifications:', notificationError);
    }
    
    res.json({ success: true, message: 'Complaint filed successfully', complaint_id: nextId });
  } catch (error) {
    await connection.rollback();
    console.error('Error filing complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to file complaint', error: error.message });
  } finally {
    await connection.end();
  }
};

exports.getComplaints = async (req, res) => {
  const connection = await connectDB();
  try {
    const formattedComplaints = await listComplaintsDetailed(connection);
    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints', error: error.message });
  } finally {
    await connection.end();
  }
};

exports.getPendingCases = async (req, res) => {
  const connection = await connectDB();
  try {
    const formattedComplaints = await listPendingComplaintsDetailed(connection);
    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching pending cases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending cases', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get count of pending cases for notification badge
exports.getPendingCasesCount = async (req, res) => {
  try {
    const { pending_count, latest_timestamp } = await getPendingCountAndLatest();
    res.json({ count: pending_count, latestTimestamp: latest_timestamp });
  } catch (error) {
    console.error('Error fetching pending cases count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending cases count', error: error.message });
  }
};

// Check database structure
exports.checkDatabaseStructure = async (req, res) => {
  const connection = await connectDB();
  try {
    
    
    // Check if complaints table exists
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'complaints'`);
    
    if (tables.length === 0) {
      return res.json({ success: false, message: 'Complaints table does not exist' });
    }
    
    // Check table structure
    const [columns] = await connection.execute(`DESCRIBE complaints`);
    
    
    // Get sample data
    const [sampleData] = await connection.execute(`SELECT id, status FROM complaints ORDER BY id DESC LIMIT 5`);
    
    
    res.json({ 
      success: true, 
      message: 'Database structure check completed',
      table_exists: true,
      columns: columns.map(col => ({ field: col.Field, type: col.Type, null: col.Null, default: col.Default })),
      sample_data: sampleData
    });
  } catch (error) {
    console.error('Error checking database structure:', error);
    res.status(500).json({ success: false, message: 'Failed to check database structure', error: error.message });
  } finally {
    await connection.end();
  }
};

exports.updateComplaint = async (req, res) => {
  const complaintId = req.params.id;
  const {
    case_title,
    case_description,
    nature_of_case,
    relief_description,
    complainant,
    respondent,
    witness
  } = req.body;

  const connection = await connectDB();
  try {
    await connection.beginTransaction();
    
    // Handle single complainant
    let complainant_id = null;
    if (complainant) {
      complainant_id = await findOrCreateResident(connection, complainant);
    }
    
    // Handle single respondent
    let respondent_id = null;
    if (respondent) {
      respondent_id = await findOrCreateResident(connection, respondent);
    }
    
    // Handle single witness (optional)
    let witness_id = null;
    if (witness) {
      witness_id = await findOrCreateResident(connection, witness);
    }
    
    // Update complaint record via model
    await updateComplaintFields(connection, complaintId, {
      case_title,
      case_description,
      nature_of_case,
      relief_description,
      complainant_id,
      respondent_id,
      witness_id,
    });
    
    await connection.commit();
    res.json({ success: true, message: 'Complaint updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to update complaint', error: error.message });
  } finally {
    await connection.end();
  }
};

// Update priority for a complaint
exports.updatePriority = async (req, res) => {
  const complaintId = req.params.id;
  const { priority } = req.body;
  const connection = await connectDB();
  try {
    await updatePriorityById(connection, complaintId, priority);
    res.json({ success: true, message: 'Priority updated successfully' });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ success: false, message: 'Failed to update priority', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all complaints for the logged-in user (including pending cases)
exports.getUserComplaints = async (req, res) => {
  const connection = await connectDB();
  try {
    const userId = req.user.id; // set by verifyToken middleware
    const formattedComplaints = await listUserComplaintsDetailed(connection, userId);
    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user complaints', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all mediation schedules for the logged-in user's cases
exports.getUserSchedules = async (req, res) => {
  const connection = await connectDB();
  try {
    const userId = req.user.id; // set by verifyToken middleware
    const schedules = await listUserSchedulesDetailed(connection, userId);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user schedules', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all withdrawn complaints
exports.getWithdrawnComplaints = async (req, res) => {
  const connection = await connectDB();
  try {
    const formattedComplaints = await listWithdrawnComplaintsDetailed(connection);
    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching withdrawn complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawn complaints', error: error.message });
  } finally {
    await connection.end();
  }
};

// Withdraw a complaint
exports.withdrawComplaint = async (req, res) => {
  const complaintId = req.params.id || req.body.id;
  const connection = await connectDB();
  try {
    await withdrawComplaintStatus(connection, complaintId);
    // notify users (implementation of notification mechanism is assumed to be handled elsewhere)
    res.json({ success: true, message: 'Complaint withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw complaint', error: error.message });
  } finally {
    await connection.end();
  }
};