const connectDB = require('../config/db');
const { notifyUsersAboutCase } = require('./notificationsController');

// Get all settlements with case details
const getSettlements = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    console.log('Connected to database for settlements fetch');
    
    // Check if settlement table exists, create if it doesn't
    try {
      await connection.execute('SELECT 1 FROM settlement LIMIT 1');
      console.log('Settlement table exists');
    } catch (tableError) {
      console.log('Settlement table does not exist, creating...');
      await connection.execute(`
        CREATE TABLE settlement (
          id INT PRIMARY KEY AUTO_INCREMENT,
          complaint_id INT NOT NULL,
          settlement_type ENUM('mediation', 'conciliation', 'arbitration') NOT NULL,
          settlement_date DATE NOT NULL,
          agreements TEXT NOT NULL,
          remarks TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
        )
      `);
      console.log('Settlement table created successfully');
    }
    
    const query = `
      SELECT 
        s.*,
        c.case_title,
        c.complainant_id,
        c.respondent_id,
        c.witness_id
      FROM settlement s
      LEFT JOIN complaints c ON s.complaint_id = c.id
      ORDER BY s.created_at DESC
    `;
    
    console.log('Executing settlements query...');
    const [settlements] = await connection.execute(query);
    console.log('Query result:', settlements.length, 'settlements found');
    
    // Process settlements to handle complainant and respondent data
    const processedSettlements = [];
    
    for (const settlement of settlements) {
      let complainants = [];
      let respondents = [];
      
      // Handle single complainant
      if (settlement.complainant_id) {
        try {
          console.log(`Looking up complainant with ID: ${settlement.complainant_id}`);
          const [residents] = await connection.execute('SELECT CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?', [settlement.complainant_id]);
          console.log(`Found ${residents.length} residents for complainant ID ${settlement.complainant_id}:`, residents);
          if (residents.length > 0) {
            complainants = [residents[0].display_name];
          } else {
            console.log(`No resident found for complainant ID: ${settlement.complainant_id}`);
            complainants = [`Resident ${settlement.complainant_id}`];
          }
        } catch (e) {
          console.error(`Error fetching complainant ${settlement.complainant_id}:`, e);
          complainants = [`Resident ${settlement.complainant_id}`];
        }
      } else {
        console.log('No complainant_id found for settlement:', settlement.id);
        complainants = ['Unknown Complainant'];
      }
      
      // Handle single respondent
      if (settlement.respondent_id) {
        try {
          console.log(`Looking up respondent with ID: ${settlement.respondent_id}`);
          const [residents] = await connection.execute('SELECT CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?', [settlement.respondent_id]);
          console.log(`Found ${residents.length} residents for respondent ID ${settlement.respondent_id}:`, residents);
          if (residents.length > 0) {
            respondents = [residents[0].display_name];
          } else {
            console.log(`No resident found for respondent ID: ${settlement.respondent_id}`);
            respondents = [`Resident ${settlement.respondent_id}`];
          }
        } catch (e) {
          console.error(`Error fetching respondent ${settlement.respondent_id}:`, e);
          respondents = [`Resident ${settlement.respondent_id}`];
        }
      } else {
        console.log('No respondent_id found for settlement:', settlement.id);
        respondents = ['Unknown Respondent'];
      }
      
      // Handle single witness
      let witnesses = [];
      if (settlement.witness_id) {
        try {
          console.log(`Looking up witness with ID: ${settlement.witness_id}`);
          const [residents] = await connection.execute('SELECT CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?', [settlement.witness_id]);
          console.log(`Found ${residents.length} residents for witness ID ${settlement.witness_id}:`, residents);
          if (residents.length > 0) {
            witnesses = [residents[0].display_name];
          } else {
            console.log(`No resident found for witness ID: ${settlement.witness_id}`);
            witnesses = [`Resident ${settlement.witness_id}`];
          }
        } catch (e) {
          console.error(`Error fetching witness ${settlement.witness_id}:`, e);
          witnesses = [`Resident ${settlement.witness_id}`];
        }
      } else {
        console.log('No witness_id found for settlement:', settlement.id);
        witnesses = ['—']; // Use dash for no witness instead of "Unknown Witness"
      }
      
      processedSettlements.push({
        id: settlement.id,
        complaint_id: settlement.complaint_id,
        case_title: settlement.case_title || `Case #${settlement.complaint_id}`,
        settlement_type: settlement.settlement_type,
        settlement_date: settlement.settlement_date,
        agreements: settlement.agreements,
        remarks: settlement.remarks,
        created_at: settlement.created_at,
        status: 'settled', // Add status field for settlement records
        complainants,
        respondents,
        witnesses
      });
    }
    
    console.log('Sending processed settlements:', processedSettlements.length);
    res.json(processedSettlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    // Always return an array, even on error
    res.json([]);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
};

// Create a new settlement
const createSettlement = async (req, res) => {
  const connection = await connectDB();
  try {
    const { complaint_id, settlement_type, settlement_date, agreements, remarks } = req.body;
    
    // Validate required fields
    if (!complaint_id || !settlement_type || !settlement_date || !agreements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert settlement
    const insertQuery = `
      INSERT INTO settlement (complaint_id, settlement_type, settlement_date, agreements, remarks)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(insertQuery, [
      complaint_id,
      settlement_type,
      settlement_date,
      agreements,
      remarks || null
    ]);
    
    // Update complaint status to 'Settled' to hide it from mediation/conciliation/arbitration tables
    await connection.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      ['Settled', complaint_id]
    );
    
    console.log(`Case ${complaint_id} status updated to 'Settled' - will no longer appear in mediation/conciliation/arbitration tables`);
    
    // Notify users about case settlement
    await notifyUsersAboutCase(complaint_id, 'case_settled');
    
    res.json({ 
      message: 'Settlement created successfully', 
      settlement_id: result.insertId 
    });
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
    
    const query = `
      SELECT 
        s.*,
        c.case_title,
        c.complainant_id,
        c.respondent_id
      FROM settlement s
      JOIN complaints c ON s.complaint_id = c.id
      WHERE s.id = ?
    `;
    
    const [settlements] = await connection.execute(query, [id]);
    
    if (settlements.length === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    
    const settlement = settlements[0];
    
    // Build complainants/respondents arrays using single party IDs (match getSettlements behavior)
    let complainants = [];
    let respondents = [];
    
    // Complainant lookup
    if (settlement.complainant_id) {
      try {
        const [residents] = await connection.execute(
          'SELECT CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?',
          [settlement.complainant_id]
        );
        complainants = residents.length > 0
          ? [residents[0].display_name]
          : [`Resident ${settlement.complainant_id}`];
      } catch (e) {
        complainants = [`Resident ${settlement.complainant_id}`];
      }
    } else {
      complainants = ['Unknown Complainant'];
    }
    
    // Respondent lookup
    if (settlement.respondent_id) {
      try {
        const [residents] = await connection.execute(
          'SELECT CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?',
          [settlement.respondent_id]
        );
        respondents = residents.length > 0
          ? [residents[0].display_name]
          : [`Resident ${settlement.respondent_id}`];
      } catch (e) {
        respondents = [`Resident ${settlement.respondent_id}`];
      }
    } else {
      respondents = ['Unknown Respondent'];
    }
    
    res.json({
      ...settlement,
      complainants,
      respondents
    });
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
    
    const updateQuery = `
      UPDATE settlement 
      SET settlement_date = ?, agreements = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await connection.execute(updateQuery, [
      settlement_date,
      agreements,
      remarks,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    
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
    
    const deleteQuery = 'DELETE FROM settlement WHERE id = ?';
    const [result] = await connection.execute(deleteQuery, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    
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
