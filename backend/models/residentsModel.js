const connectDB = require('../config/db');

// Helper to format display name consistently
function formatDisplayName(firstname, lastname, middlename) {
  const first = firstname ? String(firstname).trim() : '';
  const last = lastname ? String(lastname).trim() : '';
  const middle = middlename ? String(middlename).trim() : '';
  if (!first && !last) return '';
  let displayName = last.toUpperCase();
  if (first) displayName += ', ' + first.toUpperCase();
  if (middle) displayName += ' ' + middle.toUpperCase();
  return displayName;
}

// Variant that accepts an existing DB connection (for callers that want to reuse a connection)
async function findOrCreateResidentWithConnection(connection, residentData) {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = residentData;
  let first = firstname || '';
  let last = lastname || '';
  let middle = middlename || '';
  if (name && !firstname && !lastname) {
    const parsed = parseFullName(name);
    first = parsed.firstname;
    last = parsed.lastname;
    middle = parsed.middlename;
  }
  const [existing] = await connection.execute(
    'SELECT id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ?',
    [first, last, purok, barangay]
  );
  if (existing.length > 0) return existing[0].id;
  const [result] = await connection.execute(
    'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay) VALUES (?, ?, ?, ?, ?, ?)',
    [String(first).toUpperCase(), String(last).toUpperCase(), String(middle).toUpperCase(), purok, contact, barangay]
  );
  return result.insertId;
}

// Helper to parse a full name string into components (backward compatibility)
function parseFullName(name) {
  if (!name || typeof name !== 'string') return { firstname: '', lastname: '', middlename: '' };
  const trimmedName = name.trim();
  if (!trimmedName) return { firstname: '', lastname: '', middlename: '' };
  if (trimmedName.includes(',')) {
    const [lastnamePart, firstMiddlePart] = trimmedName.split(',').map(part => part.trim());
    const firstMiddleNames = firstMiddlePart.split(' ').filter(Boolean);
    return {
      lastname: lastnamePart.toUpperCase(),
      firstname: firstMiddleNames[0] ? firstMiddleNames[0].toUpperCase() : '',
      middlename: firstMiddleNames.slice(1).join(' ').toUpperCase(),
    };
  }
  const nameParts = trimmedName.split(' ').filter(Boolean);
  if (nameParts.length === 1) return { firstname: nameParts[0].toUpperCase(), lastname: '', middlename: '' };
  if (nameParts.length === 2) return { firstname: nameParts[0].toUpperCase(), lastname: nameParts[1].toUpperCase(), middlename: '' };
  return {
    firstname: nameParts[0].toUpperCase(),
    middlename: nameParts.slice(1, -1).join(' ').toUpperCase(),
    lastname: nameParts[nameParts.length - 1].toUpperCase(),
  };
}

async function createResident(data) {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = data;
  const connection = await connectDB();
  try {
    let first = firstname || '';
    let last = lastname || '';
    let middle = middlename || '';
    if (name && !firstname && !lastname) {
      const parsed = parseFullName(name);
      first = parsed.firstname;
      last = parsed.lastname;
      middle = parsed.middlename;
    }
    const [existing] = await connection.execute(
      'SELECT id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ?',
      [first, last, purok, barangay]
    );
    if (existing.length > 0) {
      return { existed: true, resident_id: existing[0].id };
    }
    const [result] = await connection.execute(
      'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay) VALUES (?, ?, ?, ?, ?, ?)',
      [String(first).toUpperCase(), String(last).toUpperCase(), String(middle).toUpperCase(), purok, contact, barangay]
    );
    return { existed: false, resident_id: result.insertId };
  } finally {
    await connection.end();
  }
}

async function getAllResidents() {
  const connection = await connectDB();
  try {
    const [residents] = await connection.execute(
      'SELECT *, CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents ORDER BY lastname ASC, firstname ASC'
    );
    return residents.map(r => ({ ...r, display_name: formatDisplayName(r.firstname, r.lastname, r.middlename) }));
  } finally {
    await connection.end();
  }
}

async function searchResidents(query) {
  const connection = await connectDB();
  try {
    const [residents] = await connection.execute(
      `SELECT *, CONCAT(COALESCE(lastname, ''), ", ", COALESCE(firstname, ''), " ", COALESCE(middlename, '')) as display_name
       FROM residents 
       WHERE firstname LIKE ? OR lastname LIKE ? OR middlename LIKE ? 
       ORDER BY lastname ASC, firstname ASC LIMIT 10`,
      [
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      ]
    );
    return residents.map(r => ({ ...r, display_name: formatDisplayName(r.firstname, r.lastname, r.middlename) }));
  } finally {
    await connection.end();
  }
}

async function getResidentById(id) {
  const connection = await connectDB();
  try {
    const [rows] = await connection.execute(
      'SELECT *, CONCAT(COALESCE(lastname, ""), ", ", COALESCE(firstname, ""), " ", COALESCE(middlename, "")) as display_name FROM residents WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const resident = rows[0];
    resident.display_name = formatDisplayName(resident.firstname, resident.lastname, resident.middlename);
    return resident;
  } finally {
    await connection.end();
  }
}

async function updateResident(id, data) {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = data;
  const connection = await connectDB();
  try {
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
      [String(first).toUpperCase(), String(last).toUpperCase(), String(middle).toUpperCase(), purok, contact, barangay, id]
    );
    return true;
  } finally {
    await connection.end();
  }
}

// Used by other modules during complaint creation, etc.
async function findOrCreateResident(residentData) {
  const { name, firstname, lastname, middlename, purok, contact, barangay } = residentData;
  const connection = await connectDB();
  try {
    let first = firstname || '';
    let last = lastname || '';
    let middle = middlename || '';
    if (name && !firstname && !lastname) {
      const parsed = parseFullName(name);
      first = parsed.firstname;
      last = parsed.lastname;
      middle = parsed.middlename;
    }
    const [existing] = await connection.execute(
      'SELECT id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ?',
      [first, last, purok, barangay]
    );
    if (existing.length > 0) return existing[0].id;
    const [result] = await connection.execute(
      'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay) VALUES (?, ?, ?, ?, ?, ?)',
      [String(first).toUpperCase(), String(last).toUpperCase(), String(middle).toUpperCase(), purok, contact, barangay]
    );
    return result.insertId;
  } finally {
    await connection.end();
  }
}

module.exports = {
  // helpers
  formatDisplayName,
  parseFullName,
  // operations
  createResident,
  getAllResidents,
  searchResidents,
  getResidentById,
  updateResident,
  findOrCreateResident,
  findOrCreateResidentWithConnection,
};
