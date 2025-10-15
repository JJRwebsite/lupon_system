const connectDB = require('../config/db');
const { findOrCreateResident } = require('./residentsController');
const { notifyUsersAboutCase, createNotification } = require('./notificationsController');

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
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Get the highest existing ID for the current year
    const [existingYearIds] = await connection.execute(
      'SELECT id FROM complaints WHERE id LIKE ? ORDER BY id DESC LIMIT 1',
      [`${yearPrefix}%`]
    );
    
    let nextId;
    if (existingYearIds.length === 0) {
      // First case of the year - start with 001
      nextId = parseInt(`${yearPrefix}001`);
    } else {
      // Get the last 3 digits and increment
      const lastId = existingYearIds[0].id.toString();
      const lastSequence = parseInt(lastId.slice(-3));
      const nextSequence = (lastSequence + 1).toString().padStart(3, '0');
      nextId = parseInt(`${yearPrefix}${nextSequence}`);
    }
    
    // Insert complaint with explicit ID to reuse deleted IDs
    
    // All new cases should have status 'pending' to appear in pending cases page
    const caseStatus = 'pending';
    
    const [complaintResult] = await connection.execute(
      `INSERT INTO complaints (id, case_title, case_description, nature_of_case, relief_description, complainant_id, respondent_id, witness_id, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        case_title, 
        case_description, 
        nature_of_case, 
        relief_description, 
        complainant_id, 
        respondent_id, 
        witness_id,
        caseStatus,
        user_id || null
      ]
    );
    

    
    await connection.commit();
    

    
    // Create notifications for admins about new case for approval
    try {
      // Get all admin and secretary users
      const [adminUsers] = await connection.execute(
        "SELECT id FROM users WHERE role IN ('admin', 'secretary')"
      );
      
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
    // Get all complaints with their basic information (excluding withdrawn and pending cases)
    const [complaints] = await connection.execute(`
      SELECT c.*, 
             CASE 
               WHEN comp.lastname IS NOT NULL AND comp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(comp.lastname), ', ', UPPER(comp.firstname), 
                        CASE WHEN comp.middlename IS NOT NULL AND comp.middlename != '' 
                             THEN CONCAT(' ', UPPER(comp.middlename)) 
                             ELSE '' END)
               WHEN comp.lastname IS NOT NULL THEN UPPER(comp.lastname)
               WHEN comp.firstname IS NOT NULL THEN UPPER(comp.firstname)
               WHEN comp.id IS NOT NULL THEN CONCAT('RESIDENT #', comp.id)
               ELSE 'UNKNOWN COMPLAINANT'
             END as complainant_name,
             comp.purok as complainant_purok, comp.contact as complainant_contact, comp.barangay as complainant_barangay,
             CASE 
               WHEN resp.lastname IS NOT NULL AND resp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(resp.lastname), ', ', UPPER(resp.firstname), 
                        CASE WHEN resp.middlename IS NOT NULL AND resp.middlename != '' 
                             THEN CONCAT(' ', UPPER(resp.middlename)) 
                             ELSE '' END)
               WHEN resp.lastname IS NOT NULL THEN UPPER(resp.lastname)
               WHEN resp.firstname IS NOT NULL THEN UPPER(resp.firstname)
               WHEN resp.id IS NOT NULL THEN CONCAT('RESIDENT #', resp.id)
               ELSE 'UNKNOWN RESPONDENT'
             END as respondent_name,
             resp.purok as respondent_purok, resp.contact as respondent_contact, resp.barangay as respondent_barangay,
             CASE 
               WHEN wit.lastname IS NOT NULL AND wit.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(wit.lastname), ', ', UPPER(wit.firstname), 
                        CASE WHEN wit.middlename IS NOT NULL AND wit.middlename != '' 
                             THEN CONCAT(' ', UPPER(wit.middlename)) 
                             ELSE '' END)
               WHEN wit.lastname IS NOT NULL THEN UPPER(wit.lastname)
               WHEN wit.firstname IS NOT NULL THEN UPPER(wit.firstname)
               WHEN wit.id IS NOT NULL THEN CONCAT('RESIDENT #', wit.id)
               ELSE 'UNKNOWN WITNESS'
             END as witness_name,
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      LEFT JOIN residents wit ON c.witness_id = wit.id
      WHERE c.status != 'withdrawn' AND c.status != 'pending' AND c.status IS NOT NULL
      ORDER BY c.id DESC
    `);
    
    // Process each complaint to include parties as arrays for frontend compatibility
    const formattedComplaints = complaints.map((complaint) => {
      let complainants = [];
      let respondents = [];
      let witnesses = [];
      
      // Use single party data and convert to arrays for frontend compatibility
      if (complaint.complainant_id && complaint.complainant_name) {
        complainants = [{
          id: complaint.complainant_id,
          display_name: complaint.complainant_name,
          purok: complaint.complainant_purok,
          contact: complaint.complainant_contact,
          barangay: complaint.complainant_barangay
        }];
      }
      
      if (complaint.respondent_id && complaint.respondent_name) {
        respondents = [{
          id: complaint.respondent_id,
          display_name: complaint.respondent_name,
          purok: complaint.respondent_purok,
          contact: complaint.respondent_contact,
          barangay: complaint.respondent_barangay
        }];
      }
      
      if (complaint.witness_id && complaint.witness_name) {
        witnesses = [{
          id: complaint.witness_id,
          display_name: complaint.witness_name,
          purok: complaint.witness_purok,
          contact: complaint.witness_contact,
          barangay: complaint.witness_barangay
        }];
      }
      
      return {
        ...complaint,
        // Keep arrays for backward compatibility
        complainants,
        respondents,
        witnesses,
        // Object format for complaints page compatibility
        complainant: complainants.length > 0 ? complainants[0] : null,
        respondent: respondents.length > 0 ? respondents[0] : null,
        witness: witnesses.length > 0 ? witnesses[0] : null,
        // Keep original name fields for backward compatibility
        complainant_name: complaint.complainant_name || null,
        respondent_name: complaint.respondent_name || null,
        witness_name: complaint.witness_name || null
      };
    });
    
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
    // Get all pending complaints with their resident information
    const [complaints] = await connection.execute(`
      SELECT c.*, 
             CASE 
               WHEN comp.lastname IS NOT NULL AND comp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(comp.lastname), ', ', UPPER(comp.firstname), 
                        CASE WHEN comp.middlename IS NOT NULL AND comp.middlename != '' 
                             THEN CONCAT(' ', UPPER(comp.middlename)) 
                             ELSE '' END)
               WHEN comp.lastname IS NOT NULL THEN UPPER(comp.lastname)
               WHEN comp.firstname IS NOT NULL THEN UPPER(comp.firstname)
               WHEN comp.id IS NOT NULL THEN CONCAT('RESIDENT #', comp.id)
               ELSE 'UNKNOWN COMPLAINANT'
             END as complainant_name,
             comp.purok as complainant_purok, comp.contact as complainant_contact, comp.barangay as complainant_barangay,
             CASE 
               WHEN resp.lastname IS NOT NULL AND resp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(resp.lastname), ', ', UPPER(resp.firstname), 
                        CASE WHEN resp.middlename IS NOT NULL AND resp.middlename != '' 
                             THEN CONCAT(' ', UPPER(resp.middlename)) 
                             ELSE '' END)
               WHEN resp.lastname IS NOT NULL THEN UPPER(resp.lastname)
               WHEN resp.firstname IS NOT NULL THEN UPPER(resp.firstname)
               WHEN resp.id IS NOT NULL THEN CONCAT('RESIDENT #', resp.id)
               ELSE 'UNKNOWN RESPONDENT'
             END as respondent_name,
             resp.purok as respondent_purok, resp.contact as respondent_contact, resp.barangay as respondent_barangay,
             CASE 
               WHEN wit.lastname IS NOT NULL AND wit.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(wit.lastname), ', ', UPPER(wit.firstname), 
                        CASE WHEN wit.middlename IS NOT NULL AND wit.middlename != '' 
                             THEN CONCAT(' ', UPPER(wit.middlename)) 
                             ELSE '' END)
               WHEN wit.lastname IS NOT NULL THEN UPPER(wit.lastname)
               WHEN wit.firstname IS NOT NULL THEN UPPER(wit.firstname)
               WHEN wit.id IS NOT NULL THEN CONCAT('RESIDENT #', wit.id)
               ELSE 'UNKNOWN WITNESS'
             END as witness_name,
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      LEFT JOIN residents wit ON c.witness_id = wit.id
      WHERE c.status = 'pending'
      ORDER BY c.id DESC
    `);
    
    
    
    // Format the response to match the old structure
    const formattedComplaints = complaints.map(complaint => ({
      ...complaint,
      complainant: {
        id: complaint.complainant_id,
        display_name: complaint.complainant_name,
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay
      },
      respondent: {
        id: complaint.respondent_id,
        display_name: complaint.respondent_name,
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay
      },
      witness: complaint.witness_id ? {
        id: complaint.witness_id,
        display_name: complaint.witness_name,
        purok: complaint.witness_purok,
        contact: complaint.witness_contact,
        barangay: complaint.witness_barangay
      } : null,
      // Remove the duplicate fields
      complainant_name: undefined,
      complainant_purok: undefined,
      complainant_contact: undefined,
      complainant_barangay: undefined,
      respondent_name: undefined,
      respondent_purok: undefined,
      respondent_contact: undefined,
      respondent_barangay: undefined,
      witness_name: undefined,
      witness_purok: undefined,
      witness_contact: undefined,
      witness_barangay: undefined
    }));
    
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
  const connection = await connectDB();
  try {
    const [result] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE status = 'pending'
    `);
    
    // Also get the latest case creation timestamp
    const [latestResult] = await connection.execute(`
      SELECT MAX(date_filed) as latest_case_timestamp
      FROM complaints 
      WHERE status = 'pending'
    `);
    
    const count = result[0].count;
    const latestTimestamp = latestResult[0].latest_case_timestamp;
    
    
    res.json({ count, latestTimestamp });
  } catch (error) {
    console.error('Error fetching pending cases count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending cases count', error: error.message });
  } finally {
    await connection.end();
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
    
    // Update complaint with single resident references
    await connection.execute(
      `UPDATE complaints SET case_title = ?, case_description = ?, nature_of_case = ?, relief_description = ?, complainant_id = ?, respondent_id = ?, witness_id = ? WHERE id = ?`,
      [case_title, case_description, nature_of_case, relief_description, complainant_id, respondent_id, witness_id, complaintId]
    );
    
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

// Withdraw a complaint (set status to 'withdrawn' and date_withdrawn)
exports.withdrawComplaint = async (req, res) => {
  const complaintId = req.params.id;
  const connection = await connectDB();
  try {
    await connection.execute(
      `UPDATE complaints SET status = 'withdrawn', date_withdrawn = NOW() WHERE id = ?`,
      [complaintId]
    );
    
    // Create notification for users about withdrawal
    await notifyUsersAboutCase(complaintId, 'case_withdrawn');
    
    res.json({ success: true, message: 'Complaint withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw complaint', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all withdrawn complaints
exports.getWithdrawnComplaints = async (req, res) => {
  const connection = await connectDB();
  try {
    // Get all withdrawn complaints with their resident information
    const [complaints] = await connection.execute(`
      SELECT c.*, 
             CASE 
               WHEN comp.lastname IS NOT NULL AND comp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(comp.lastname), ', ', UPPER(comp.firstname), 
                        CASE WHEN comp.middlename IS NOT NULL AND comp.middlename != '' 
                             THEN CONCAT(' ', UPPER(comp.middlename)) 
                             ELSE '' END)
               WHEN comp.lastname IS NOT NULL THEN UPPER(comp.lastname)
               WHEN comp.firstname IS NOT NULL THEN UPPER(comp.firstname)
               WHEN comp.id IS NOT NULL THEN CONCAT('RESIDENT #', comp.id)
               ELSE 'UNKNOWN COMPLAINANT'
             END as complainant_name,
             comp.purok as complainant_purok, comp.contact as complainant_contact, comp.barangay as complainant_barangay,
             CASE 
               WHEN resp.lastname IS NOT NULL AND resp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(resp.lastname), ', ', UPPER(resp.firstname), 
                        CASE WHEN resp.middlename IS NOT NULL AND resp.middlename != '' 
                             THEN CONCAT(' ', UPPER(resp.middlename)) 
                             ELSE '' END)
               WHEN resp.lastname IS NOT NULL THEN UPPER(resp.lastname)
               WHEN resp.firstname IS NOT NULL THEN UPPER(resp.firstname)
               WHEN resp.id IS NOT NULL THEN CONCAT('RESIDENT #', resp.id)
               ELSE 'UNKNOWN RESPONDENT'
             END as respondent_name,
             resp.purok as respondent_purok, resp.contact as respondent_contact, resp.barangay as respondent_barangay,
             CASE 
               WHEN wit.lastname IS NOT NULL AND wit.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(wit.lastname), ', ', UPPER(wit.firstname), 
                        CASE WHEN wit.middlename IS NOT NULL AND wit.middlename != '' 
                             THEN CONCAT(' ', UPPER(wit.middlename)) 
                             ELSE '' END)
               WHEN wit.lastname IS NOT NULL THEN UPPER(wit.lastname)
               WHEN wit.firstname IS NOT NULL THEN UPPER(wit.firstname)
               WHEN wit.id IS NOT NULL THEN CONCAT('RESIDENT #', wit.id)
               ELSE 'UNKNOWN WITNESS'
             END as witness_name,
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      LEFT JOIN residents wit ON c.witness_id = wit.id
      WHERE c.status = 'withdrawn'
      ORDER BY c.id DESC
    `);
    
    // Format the response to match frontend expectations (arrays for complainants/respondents)
    const formattedComplaints = complaints.map(complaint => ({
      ...complaint,
      // Frontend expects complainants and respondents as arrays
      complainants: complaint.complainant_name ? [{
        id: complaint.complainant_id,
        display_name: complaint.complainant_name,
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay
      }] : [],
      respondents: complaint.respondent_name ? [{
        id: complaint.respondent_id,
        display_name: complaint.respondent_name,
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay
      }] : [],
      // Keep single objects for backward compatibility
      complainant: {
        id: complaint.complainant_id,
        name: complaint.complainant_name || 'Unknown',
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay
      },
      respondent: {
        id: complaint.respondent_id,
        name: complaint.respondent_name || 'Unknown',
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay
      },
      witness: complaint.witness_id ? {
        id: complaint.witness_id,
        display_name: complaint.witness_name,
        purok: complaint.witness_purok,
        contact: complaint.witness_contact,
        barangay: complaint.witness_barangay
      } : null,
      // Remove the duplicate fields
      complainant_name: undefined,
      complainant_purok: undefined,
      complainant_contact: undefined,
      complainant_barangay: undefined,
      respondent_name: undefined,
      respondent_purok: undefined,
      respondent_contact: undefined,
      respondent_barangay: undefined,
      witness_name: undefined,
      witness_purok: undefined,
      witness_contact: undefined,
      witness_barangay: undefined
    }));
    
    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching withdrawn complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawn complaints', error: error.message });
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
    await connection.execute(
      'UPDATE complaints SET priority = ? WHERE id = ?',
      [priority, complaintId]
    );
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
    // Get current user from JWT token (set by verifyToken middleware)
    const userId = req.user.id;
    
    // Get all complaints for this user (including pending cases)
    const [complaints] = await connection.execute(`
      SELECT c.*, 
             CONCAT(COALESCE(comp.lastname, ''), ', ', COALESCE(comp.firstname, ''), ' ', COALESCE(comp.middlename, '')) as complainant_name, 
             comp.purok as complainant_purok, comp.contact as complainant_contact, comp.barangay as complainant_barangay,
             CONCAT(COALESCE(resp.lastname, ''), ', ', COALESCE(resp.firstname, ''), ' ', COALESCE(resp.middlename, '')) as respondent_name, 
             resp.purok as respondent_purok, resp.contact as respondent_contact, resp.barangay as respondent_barangay,
             CONCAT(COALESCE(wit.lastname, ''), ', ', COALESCE(wit.firstname, ''), ' ', COALESCE(wit.middlename, '')) as witness_name, 
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      LEFT JOIN residents wit ON c.witness_id = wit.id
      WHERE c.user_id = ? AND c.status != 'withdrawn'
      ORDER BY c.id DESC
    `, [userId]);
    
    // Process each complaint to include parties as arrays for frontend compatibility
    const formattedComplaints = complaints.map((complaint) => {
      let complainants = [];
      let respondents = [];
      let witnesses = [];
      
      // Use single party data and convert to arrays for frontend compatibility
      if (complaint.complainant_id && complaint.complainant_name) {
        complainants = [{
          id: complaint.complainant_id,
          display_name: complaint.complainant_name,
          purok: complaint.complainant_purok,
          contact: complaint.complainant_contact,
          barangay: complaint.complainant_barangay
        }];
      }
      
      if (complaint.respondent_id && complaint.respondent_name) {
        respondents = [{
          id: complaint.respondent_id,
          display_name: complaint.respondent_name,
          purok: complaint.respondent_purok,
          contact: complaint.respondent_contact,
          barangay: complaint.respondent_barangay
        }];
      }
      
      if (complaint.witness_id && complaint.witness_name) {
        witnesses = [{
          id: complaint.witness_id,
          display_name: complaint.witness_name,
          purok: complaint.witness_purok,
          contact: complaint.witness_contact,
          barangay: complaint.witness_barangay
        }];
      }
      
      return {
        ...complaint,
        complainants,
        respondents,
        witnesses,
        complainant: complainants.length > 0 ? complainants[0] : null,
        respondent: respondents.length > 0 ? respondents[0] : null,
        witness: witnesses.length > 0 ? witnesses[0] : null,
        // Remove the duplicate fields
        complainant_name: complaint.complainant_name || null,
        complainant_purok: undefined,
        complainant_contact: undefined,
        complainant_barangay: undefined,
        respondent_name: complaint.respondent_name || null,
        respondent_purok: undefined,
        respondent_content: undefined,
        respondent_barangay: undefined,
        witness_name: complaint.witness_name || null,
        witness_purok: undefined,
        witness_contact: undefined,
        witness_barangay: undefined
      };
    });
    
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
  try {
    // Get current user from JWT token (set by verifyToken middleware)
    const userId = req.user.id;
    
    const connection = await connectDB();
    // Get all complaints for this user
    const [complaints] = await connection.execute('SELECT * FROM complaints WHERE user_id = ?', [userId]);
    let schedules = [];
    for (const complaint of complaints) {
      // Get all mediation sessions for this complaint
      const [mediations] = await connection.execute('SELECT * FROM mediation WHERE complaint_id = ?', [complaint.id]);
      for (const mediation of mediations) {
        schedules.push({
          id: mediation.id,
          case_no: complaint.id,
          case_title: complaint.case_title,
          case_description: complaint.case_description,
          nature_of_case: complaint.nature_of_case,
          relief_description: complaint.relief_description,
          date_filed: complaint.date_filed,
          complainant: '', // can be filled if needed
          respondent: '', // can be filled if needed
          schedule_date: mediation.date,
          schedule_time: mediation.time,
          case_status: complaint.status,
        });
      }
    }
    // Fetch complainant/respondent names from residents table
    for (let sched of schedules) {
      const [complaint] = await connection.execute(`
        SELECT 
          TRIM(CONCAT(
            UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
            CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
          )) AS complainant_name,
          TRIM(CONCAT(
            UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
            CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
          )) AS respondent_name
        FROM complaints c
        LEFT JOIN residents comp ON c.complainant_id = comp.id
        LEFT JOIN residents resp ON c.respondent_id = resp.id
        WHERE c.id = ?
      `, [sched.case_no]);
      
      if (complaint.length > 0) {
        sched.complainant = complaint[0].complainant_name || '';
        sched.respondent = complaint[0].respondent_name || '';
      }
    }
    await connection.end();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user schedules', error: error.message });
  }
}; 