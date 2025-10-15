const connectDB = require('../config/db');

// Helper function to format display name
function formatDisplayName(firstname, lastname, middlename) {
  const first = firstname ? firstname.trim() : '';
  const last = lastname ? lastname.trim() : '';
  const middle = middlename ? middlename.trim() : '';
  
  if (!first && !last) return '';
  
  return `${last.toUpperCase()}, ${first.toUpperCase()}${middle ? ' ' + middle.toUpperCase() : ''}`;
}

exports.getAllSecretaries = async (req, res) => {
  try {
    const db = await connectDB();
    const [rows] = await db.query('SELECT id, firstname, lastname, middlename, status, date_added FROM lupon_secretary');
    
    // Add formatted display name to each row
    const formattedRows = rows.map(row => ({
      ...row,
      name: formatDisplayName(row.firstname, row.lastname, row.middlename),
      display_name: formatDisplayName(row.firstname, row.lastname, row.middlename)
    }));
    
    res.json(formattedRows);
    await db.end();
  } catch (err) {
    console.error('Failed to fetch secretaries:', err);
    res.status(500).json({ error: 'Failed to fetch secretaries' });
  }
};

exports.addSecretary = async (req, res) => {
  const { name, firstname, lastname, middlename, status, dateAdded } = req.body;
  
  // Parse name if provided as single string (for backward compatibility)
  let first = firstname || '';
  let last = lastname || '';
  let middle = middlename || '';
  
  if (name && !firstname && !lastname) {
    // Parse the formatted name "LASTNAME, FIRSTNAME MIDDLENAME"
    if (name.includes(',')) {
      const [lastnamePart, firstMiddlePart] = name.split(',').map(part => part.trim());
      const firstMiddleNames = firstMiddlePart.split(' ').filter(part => part.length > 0);
      
      last = lastnamePart.toUpperCase();
      first = firstMiddleNames[0] ? firstMiddleNames[0].toUpperCase() : '';
      middle = firstMiddleNames.slice(1).join(' ').toUpperCase();
    }
  }
  
  try {
    const db = await connectDB();
    await db.query(
      'INSERT INTO lupon_secretary (firstname, lastname, middlename, status, date_added) VALUES (?, ?, ?, ?, ?)',
      [first.toUpperCase(), last.toUpperCase(), middle.toUpperCase(), status || 'Active', dateAdded || new Date()]
    );
    res.status(201).json({ message: 'Secretary added' });
    await db.end();
  } catch (err) {
    console.error('Failed to add secretary:', err);
    res.status(500).json({ error: 'Failed to add secretary' });
  }
};

// Edit a secretary
exports.editSecretary = async (req, res) => {
  const { id } = req.params;
  const { name, firstname, lastname, middlename } = req.body;
  
  // Parse name if provided as single string (for backward compatibility)
  let first = firstname || '';
  let last = lastname || '';
  let middle = middlename || '';
  
  if (name && !firstname && !lastname) {
    // Parse the formatted name "LASTNAME, FIRSTNAME MIDDLENAME"
    if (name.includes(',')) {
      const [lastnamePart, firstMiddlePart] = name.split(',').map(part => part.trim());
      const firstMiddleNames = firstMiddlePart.split(' ').filter(part => part.length > 0);
      
      last = lastnamePart.toUpperCase();
      first = firstMiddleNames[0] ? firstMiddleNames[0].toUpperCase() : '';
      middle = firstMiddleNames.slice(1).join(' ').toUpperCase();
    }
  }
  
  try {
    const db = await connectDB();
    await db.query(
      'UPDATE lupon_secretary SET firstname = ?, lastname = ?, middlename = ? WHERE id = ?',
      [first.toUpperCase(), last.toUpperCase(), middle.toUpperCase(), id]
    );
    res.json({ message: 'Secretary updated' });
    await db.end();
  } catch (err) {
    console.error('Failed to update secretary:', err);
    res.status(500).json({ error: 'Failed to update secretary' });
  }
};

// Remove a secretary
exports.removeSecretary = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectDB();
    await db.query('DELETE FROM lupon_secretary WHERE id = ?', [id]);
    res.json({ message: 'Secretary removed' });
    await db.end();
  } catch (err) {
    console.error('Failed to remove secretary:', err);
    res.status(500).json({ error: 'Failed to remove secretary' });
  }
}; 