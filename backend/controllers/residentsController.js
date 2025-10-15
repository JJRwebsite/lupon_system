const connectDB = require('../config/db');

// Helper function to format display name
function formatDisplayName(firstname, lastname, middlename) {
  const first = firstname ? firstname.trim() : '';
  const last = lastname ? lastname.trim() : '';
  const middle = middlename ? middlename.trim() : '';
  
  if (!first && !last) return '';
  
  let displayName = last.toUpperCase();
  if (first) displayName += ', ' + first.toUpperCase();
  if (middle) displayName += ' ' + middle.toUpperCase();
  
  return displayName;
}

// Helper function to parse full name into components
function parseFullName(name) {
  if (!name || typeof name !== 'string') {
    return { firstname: '', lastname: '', middlename: '' };
  }
  
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { firstname: '', lastname: '', middlename: '' };
  }
  
  // Handle formatted name "LASTNAME, FIRSTNAME MIDDLENAME"
  if (trimmedName.includes(',')) {
    const [lastnamePart, firstMiddlePart] = trimmedName.split(',').map(part => part.trim());
    const firstMiddleNames = firstMiddlePart.split(' ').filter(part => part.length > 0);
    
    return {
      lastname: lastnamePart.toUpperCase(),
      firstname: firstMiddleNames[0] ? firstMiddleNames[0].toUpperCase() : '',
      middlename: firstMiddleNames.slice(1).join(' ').toUpperCase()
    };
  }
  
  // Handle regular name "FIRSTNAME MIDDLENAME LASTNAME"
  const nameParts = trimmedName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    return { firstname: nameParts[0].toUpperCase(), lastname: '', middlename: '' };
  } else if (nameParts.length === 2) {
    return { firstname: nameParts[0].toUpperCase(), lastname: nameParts[1].toUpperCase(), middlename: '' };
  } else {
    return {
      firstname: nameParts[0].toUpperCase(),
      middlename: nameParts.slice(1, -1).join(' ').toUpperCase(),
      lastname: nameParts[nameParts.length - 1].toUpperCase()
    };
  }
}

// Create a new resident
exports.createResident = async (req, res) => {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = req.body;
  const connection = await connectDB();
  
  try {
    // Parse name if provided as single string (for backward compatibility)
    let first = firstname || '';
    let last = lastname || '';
    let middle = middlename || '';
    
    if (name && !firstname && !lastname) {
      const parsed = parseFullName(name);
      first = parsed.firstname;
      last = parsed.lastname;
      middle = parsed.middlename;
    }
    
    // Check if resident already exists (using firstname + lastname + location)
    const [existing] = await connection.execute(
      'SELECT id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ?',
      [first, last, purok, barangay]
    );
    
    if (existing.length > 0) {
      return res.json({ success: true, resident_id: existing[0].id, message: 'Resident already exists' });
    }
    
    // Insert new resident
    const [result] = await connection.execute(
      'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay) VALUES (?, ?, ?, ?, ?, ?)',
      [first.toUpperCase(), last.toUpperCase(), middle.toUpperCase(), purok, contact, barangay]
    );
    
    res.json({ success: true, resident_id: result.insertId, message: 'Resident created successfully' });
  } catch (error) {
    console.error('Error creating resident:', error);
    res.status(500).json({ success: false, message: 'Failed to create resident', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get all residents
exports.getAllResidents = async (req, res) => {
  const connection = await connectDB();
  
  try {
    const [residents] = await connection.execute(
      'SELECT *, CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents ORDER BY lastname ASC, firstname ASC'
    );
    
    // Add display_name for each resident
    const residentsWithDisplayName = residents.map(resident => ({
      ...resident,
      display_name: formatDisplayName(resident.firstname, resident.lastname, resident.middlename)
    }));
    
    res.json(residentsWithDisplayName);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch residents', error: error.message });
  } finally {
    await connection.end();
  }
};

// Search residents by name
exports.searchResidents = async (req, res) => {
  const { query } = req.query;
  const connection = await connectDB();
  
  try {
    const [residents] = await connection.execute(
      `SELECT *, CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name 
       FROM residents 
       WHERE firstname LIKE ? OR lastname LIKE ? OR middlename LIKE ? 
       ORDER BY lastname ASC, firstname ASC LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    
    // Add display_name for each resident
    const residentsWithDisplayName = residents.map(resident => ({
      ...resident,
      display_name: formatDisplayName(resident.firstname, resident.lastname, resident.middlename)
    }));
    
    res.json(residentsWithDisplayName);
  } catch (error) {
    console.error('Error searching residents:', error);
    res.status(500).json({ success: false, message: 'Failed to search residents', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get resident by ID
exports.getResidentById = async (req, res) => {
  const { id } = req.params;
  const connection = await connectDB();
  
  try {
    const [residents] = await connection.execute(
      'SELECT *, CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?', 
      [id]
    );
    
    if (residents.length === 0) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    const resident = residents[0];
    resident.display_name = formatDisplayName(resident.firstname, resident.lastname, resident.middlename);
    
    res.json(resident);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resident', error: error.message });
  } finally {
    await connection.end();
  }
};

// Update resident
exports.updateResident = async (req, res) => {
  const { id } = req.params;
  const { name, firstname, lastname, middlename, purok, contact, barangay } = req.body;
  const connection = await connectDB();
  
  try {
    // Parse name if provided as single string (for backward compatibility)
    let first = firstname || '';
    let last = lastname || '';
    let middle = middlename || '';
    
    if (name && !firstname && !lastname) {
      const parsed = parseFullName(name);
      first = parsed.firstname;
      last = parsed.lastname;
      middle = parsed.middlename;
    }
    
    await connection.execute(
      'UPDATE residents SET firstname = ?, lastname = ?, middlename = ?, purok = ?, contact = ?, barangay = ? WHERE id = ?',
      [first.toUpperCase(), last.toUpperCase(), middle.toUpperCase(), purok, contact, barangay, id]
    );
    
    res.json({ success: true, message: 'Resident updated successfully' });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ success: false, message: 'Failed to update resident', error: error.message });
  } finally {
    await connection.end();
  }
};

// Helper function to find or create resident
exports.findOrCreateResident = async (connection, residentData) => {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = residentData;
  
  // Parse name if provided as single string (for backward compatibility)
  let first = firstname || '';
  let last = lastname || '';
  let middle = middlename || '';
  
  if (name && !firstname && !lastname) {
    const parsed = parseFullName(name);
    first = parsed.firstname;
    last = parsed.lastname;
    middle = parsed.middlename;
  }
  
  // First try to find existing resident using name components
  const [existing] = await connection.execute(
    'SELECT id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ?',
    [first, last, purok, barangay]
  );
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new resident if not found
  const [result] = await connection.execute(
    'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay) VALUES (?, ?, ?, ?, ?, ?)',
    [first.toUpperCase(), last.toUpperCase(), middle.toUpperCase(), purok, contact, barangay]
  );
  
  return result.insertId;
};
