const connectDB = require('../config/db');

async function withConn(passed, fn) {
  if (passed) return fn(passed);
  const conn = await connectDB();
  try { return await fn(conn); } finally { await conn.end(); }
}

async function findUserByEmail(connection, email) {
  return withConn(connection, async (conn) => {
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows;
  });
}

async function insertUser(connection, user) {
  return withConn(connection, async (conn) => {
    const {
      last_name, first_name, middle_name = '', email, password,
      birth_date = null, gender = null, purok = null, barangay = null, municipality = null, role = 'user'
    } = user;
    const [result] = await conn.execute(
      `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, purok, barangay, municipality, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [last_name, first_name, middle_name, email, password, birth_date, gender, purok, barangay, municipality, role]
    );
    return result.insertId;
  });
}

async function updatePasswordByEmail(connection, email, hashedPassword) {
  return withConn(connection, async (conn) => {
    const [res] = await conn.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    return res.affectedRows;
  });
}

module.exports = {
  findUserByEmail,
  insertUser,
  updatePasswordByEmail,
};
