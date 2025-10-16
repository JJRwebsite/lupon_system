const connectDB = require('../config/db');

// Create core tables if they do not exist (PostgreSQL)
async function bootstrapCoreTables() {
  const connection = await connectDB();
  try {
    // USERS table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        last_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        birth_date DATE NOT NULL,
        gender VARCHAR(50) NOT NULL,
        purok TEXT NOT NULL DEFAULT '',
        barangay VARCHAR(255) NOT NULL,
        municipality VARCHAR(100) NOT NULL DEFAULT '',
        province VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
        updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
      )
    `);

    // Ensure recently added columns exist on users
    await connection.execute(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS purok TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS municipality VARCHAR(100) NOT NULL DEFAULT ''
    `);

    // COMPLAINTS table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS complaints (
        id BIGINT PRIMARY KEY,
        case_title VARCHAR(255) NOT NULL,
        case_description TEXT,
        nature_of_case VARCHAR(255),
        relief_description TEXT,
        complainant_id INTEGER,
        respondent_id INTEGER,
        witness_id INTEGER,
        user_id INTEGER,
        status VARCHAR(50),
        priority INTEGER,
        date_filed TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
        incident_date DATE,
        incident_time TIME,
        incident_place VARCHAR(255),
        created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
        updated_at TIMESTAMP
      )
    `);
    // Ensure updated_at exists for complaints if table already existed
    await connection.execute(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`);

    console.log('Core tables bootstrapped (users, complaints).');
  } catch (err) {
    console.error('Bootstrap core tables failed:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

module.exports = { bootstrapCoreTables };
