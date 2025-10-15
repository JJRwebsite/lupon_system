const connectDB = require('../config/db');
const { notifyUsersAboutReferral } = require('./notificationsController');

// Create referrals table if it doesn't exist
exports.createReferralsTable = async () => {
  const connection = await connectDB();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_complaint_id INT NOT NULL,
        case_title VARCHAR(255) NOT NULL,
        case_description TEXT,
        nature_of_case VARCHAR(255),
        relief_sought TEXT,
        incident_date DATE,
        incident_time TIME,
        incident_place VARCHAR(255),
        complainant_id INT,
        respondent_id INT,
        witness_id INT,
        referred_to VARCHAR(255) NOT NULL,
        referral_reason TEXT,
        referred_by INT,
        date_referred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'referred',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns to existing table if they don't exist
    const columnsToAdd = [
      { name: 'case_description', type: 'TEXT' },
      { name: 'nature_of_case', type: 'VARCHAR(255)' },
      { name: 'relief_sought', type: 'TEXT' },
      { name: 'incident_date', type: 'DATE' },
      { name: 'incident_time', type: 'TIME' },
      { name: 'incident_place', type: 'VARCHAR(255)' },
      { name: 'date_referred', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await connection.execute(`
          ALTER TABLE referrals ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`Added column ${column.name} to referrals table`);
      } catch (error) {
        // Column might already exist, ignore duplicate column errors
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Error adding column ${column.name}:`, error.message);
        }
      }
    }
    
    // Fix existing referral records that have null date_referred (after ensuring column exists)
    try {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count FROM referrals WHERE date_referred IS NULL
      `);
      
      if (rows[0].count > 0) {
        await connection.execute(`
          UPDATE referrals 
          SET date_referred = COALESCE(created_at, NOW()) 
          WHERE date_referred IS NULL
        `);
        console.log(`Updated ${rows[0].count} null date_referred values with timestamps`);
      }
    } catch (error) {
      // If date_referred column doesn't exist yet, ignore this error
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        console.error('Error updating null date_referred values:', error.message);
      }
    }
    
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
  
  // Get user ID from JWT token (provided by verifyToken middleware)
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const userId = req.user.id;
  console.log(`📤 Transferring complaint ${complaintId} by user ${userId} to ${referred_to}`);

  const connection = await connectDB();
  try {
    // Get the original complaint data
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
      WHERE c.id = ?
    `, [complaintId]);

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Insert into referrals table with all case data preserved
    const [result] = await connection.execute(`
      INSERT INTO referrals (
        original_complaint_id, case_title, case_description, nature_of_case, relief_sought,
        complainant_id, respondent_id, witness_id, referred_to, referral_reason, referred_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      complaint.id,
      complaint.case_title || null,
      complaint.case_description || null,
      complaint.nature_of_case || null,
      complaint.relief_description || null,
      complaint.complainant_id || null,
      complaint.respondent_id || null,
      complaint.witness_id || null,
      referred_to,
      referral_reason,
      userId // Use authenticated user ID
    ]);

    // Delete the original complaint from complaints table
    await connection.execute('DELETE FROM complaints WHERE id = ?', [complaintId]);

    // Create notification for users about case transfer
    await notifyUsersAboutReferral(result.insertId, complaintId);

    res.json({ 
      success: true, 
      message: 'Complaint transferred to referrals successfully',
      referralId: result.insertId
    });
  } catch (error) {
    console.error('❌ Error transferring complaint:', {
      complaintId,
      userId,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to transfer complaint',
      details: error.message,
      code: error.code
    });
  } finally {
    await connection.end();
  }
};

// Get all referrals
exports.getReferrals = async (req, res) => {
  const connection = await connectDB();
  try {
    const [referrals] = await connection.execute(`
      SELECT r.*, 
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
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay,
             CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as referred_by_name
      FROM referrals r
      LEFT JOIN residents comp ON r.complainant_id = comp.id
      LEFT JOIN residents resp ON r.respondent_id = resp.id
      LEFT JOIN residents wit ON r.witness_id = wit.id
      LEFT JOIN users u ON r.referred_by = u.id
      ORDER BY r.created_at DESC
    `);

    // Format the data
    const formattedReferrals = referrals.map(r => ({
      id: r.id,
      original_complaint_id: r.original_complaint_id,
      case_title: r.case_title,
      case_description: r.case_description,
      nature_of_case: r.nature_of_case,
      relief_sought: r.relief_sought,
      incident_date: r.incident_date,
      incident_time: r.incident_time,
      incident_place: r.incident_place,
      complainant: r.complainant_id ? {
        id: r.complainant_id,
        name: r.complainant_name,
        purok: r.complainant_purok,
        contact: r.complainant_contact,
        barangay: r.complainant_barangay
      } : null,
      respondent: r.respondent_id ? {
        id: r.respondent_id,
        name: r.respondent_name,
        purok: r.respondent_purok,
        contact: r.respondent_contact,
        barangay: r.respondent_barangay
      } : null,
      witness: r.witness_id ? {
        id: r.witness_id,
        name: r.witness_name,
        purok: r.witness_purok,
        contact: r.witness_contact,
        barangay: r.witness_barangay
      } : null,
      referred_to: r.referred_to,
      referral_reason: r.referral_reason,
      referred_by: r.referred_by_name,
      date_referred: r.date_referred,
      status: r.status,
      created_at: r.created_at
    }));

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
    await connection.execute(
      'UPDATE referrals SET status = ? WHERE id = ?',
      [status, referralId]
    );

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
    await connection.execute('DELETE FROM referrals WHERE id = ?', [referralId]);
    res.json({ success: true, message: 'Referral deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({ error: 'Failed to delete referral' });
  } finally {
    await connection.end();
  }
};
