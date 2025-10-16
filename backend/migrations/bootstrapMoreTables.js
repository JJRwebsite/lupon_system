const connectDB = require('../config/db');

// Convert and create MySQL tables in PostgreSQL (idempotent)
async function bootstrapMoreTables() {
  const conn = await connectDB();
  try {
    // Residents
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS residents (
        id SERIAL PRIMARY KEY,
        purok VARCHAR(100),
        contact VARCHAR(100),
        barangay VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        user_id INTEGER,
        firstname VARCHAR(100),
        lastname VARCHAR(100),
        middlename VARCHAR(100)
      )
    `);

    // Complaints (ensure columns superset)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS complaints (
        id BIGINT PRIMARY KEY,
        case_title VARCHAR(255),
        case_description TEXT,
        nature_of_case VARCHAR(255),
        relief_description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        date_filed TIMESTAMP DEFAULT NOW(),
        date_withdrawn TIMESTAMP,
        user_id INTEGER,
        complainant_id INTEGER,
        respondent_id INTEGER,
        witness_id INTEGER
      )
    `);

    // Mediation and related
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mediation (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER,
        date DATE,
        time TIME,
        created_at TIMESTAMP DEFAULT NOW(),
        is_deleted BOOLEAN DEFAULT FALSE
      )
    `);
    // Ensure minutes column exists for mediation
    await conn.execute(`ALTER TABLE mediation ADD COLUMN IF NOT EXISTS minutes TEXT`);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mediation_documentation (
        id SERIAL PRIMARY KEY,
        mediation_id INTEGER,
        file_path VARCHAR(500),
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mediation_reschedule (
        id SERIAL PRIMARY KEY,
        mediation_id INTEGER NOT NULL,
        reschedule_date DATE,
        reschedule_time TIME,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        minutes TEXT,
        documentation_id TEXT
      )
    `);

    // Conciliation and related
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conciliation (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER,
        date DATE,
        time TIME,
        created_at TIMESTAMP DEFAULT NOW(),
        lupon_panel TEXT
      )
    `);
    // Ensure minutes column exists for conciliation
    await conn.execute(`ALTER TABLE conciliation ADD COLUMN IF NOT EXISTS minutes TEXT`);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conciliation_documentation (
        id SERIAL PRIMARY KEY,
        conciliation_id INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conciliation_reschedule (
        id SERIAL PRIMARY KEY,
        conciliation_id INTEGER NOT NULL,
        reschedule_date DATE NOT NULL,
        reschedule_time TIME NOT NULL,
        reason VARCHAR(500),
        minutes TEXT,
        documentation_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Arbitration and related
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS arbitration (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_deleted BOOLEAN DEFAULT FALSE,
        panel_members TEXT
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS arbitration_documentation (
        id SERIAL PRIMARY KEY,
        arbitration_id INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS arbitration_reschedule (
        id SERIAL PRIMARY KEY,
        arbitration_id INTEGER NOT NULL,
        reschedule_date DATE NOT NULL,
        reschedule_time TIME NOT NULL,
        minutes TEXT,
        reason VARCHAR(255) DEFAULT 'Initial session',
        documentation_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        complaint_id INTEGER,
        referral_id INTEGER,
        type TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Referrals (ensure superset of columns)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        original_complaint_id INTEGER NOT NULL,
        case_title VARCHAR(255) NOT NULL,
        complainant_id INTEGER,
        respondent_id INTEGER,
        witness_id INTEGER,
        nature_of_complaint TEXT,
        referred_to VARCHAR(255) NOT NULL,
        referral_reason TEXT,
        referred_by INTEGER,
        referral_date TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'referred',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        case_description TEXT,
        nature_of_case VARCHAR(255),
        relief_sought TEXT,
        incident_date DATE,
        incident_time TIME,
        incident_place VARCHAR(255),
        date_referred TIMESTAMP DEFAULT NOW()
      )
    `);

    // Lupon chairperson/members/secretary
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lupon_chairperson (
        id SERIAL PRIMARY KEY,
        status TEXT DEFAULT 'Active',
        date_added DATE DEFAULT CURRENT_DATE,
        firstname VARCHAR(100) DEFAULT '',
        lastname VARCHAR(100) DEFAULT '',
        middlename VARCHAR(100) DEFAULT ''
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lupon_members (
        id SERIAL PRIMARY KEY,
        status TEXT DEFAULT 'Active',
        date_added DATE DEFAULT CURRENT_DATE,
        firstname VARCHAR(100) DEFAULT '',
        lastname VARCHAR(100) DEFAULT '',
        middlename VARCHAR(100) DEFAULT ''
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lupon_secretary (
        id SERIAL PRIMARY KEY,
        status TEXT DEFAULT 'Active',
        date_added DATE DEFAULT CURRENT_DATE,
        firstname VARCHAR(100) DEFAULT '',
        lastname VARCHAR(100) DEFAULT '',
        middlename VARCHAR(100) DEFAULT ''
      )
    `);

    // Basic indexes (foreign keys optional for now; add later as needed)
    await conn.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await conn.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)`);
    await conn.execute(`CREATE INDEX IF NOT EXISTS idx_mediation_complaint ON mediation(complaint_id)`);
    await conn.execute(`CREATE INDEX IF NOT EXISTS idx_conciliation_complaint ON conciliation(complaint_id)`);
    await conn.execute(`CREATE INDEX IF NOT EXISTS idx_arbitration_complaint ON arbitration(complaint_id)`);

    console.log('Additional tables bootstrapped (PostgreSQL).');
  } finally {
    await conn.end();
  }
}

module.exports = { bootstrapMoreTables };
