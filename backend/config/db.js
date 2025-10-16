require("dotenv").config();
// const mysql = require('mysql2/promise');

// const dbConfig = {
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'lupon_system'
// };

// const connectDB = async () => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     console.log('MySQL DB Connected...');
//     return connection;
//   } catch (err) {
//     console.error('Database connection error:', err.message);
//     throw err; // Throw the error instead of exiting the process
//   }
// };

// module.exports = connectDB; 

const { Pool } = require('pg');

// Using the full Neon connection string from your .env
/**
 * A connection pool to the PostgreSQL database using the full Neon connection string from your .env.
 * @type {Pool}
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon SSL connections
  },
  // Set timezone to Philippine time (UTC+8)
  options: '-c timezone=Asia/Manila',
});

// Helper: convert MySQL-style `?` placeholders to PostgreSQL `$1, $2, ...`
function toPgParams(sql, values = []) {
  let i = 0;
  const converted = sql.replace(/\?/g, () => `$${++i}`);
  return { text: converted, values };
}

// Return a lightweight adapter that mimics common mysql2 connection APIs on top of pg's pool
const connectDB = async () => {
  try {
    // Test connectivity once
    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL Database...');
    client.release();

    // Provide an adapter with mysql-like methods backed by pg Pool
    // Maintain a pinned client during an active transaction
    let txClient = null;
    const adapter = {
      // Preferred pg usage
      query: async (sql, params = []) => {
        const { text, values } = toPgParams(sql, params);
        const executor = txClient || pool;
        const result = await executor.query(text, values);
        // mysql2 returns [rows, fields]; many callsites destructure first item
        return [result.rows, result.fields || []];
      },
      // Back-compat for existing code using connection.execute(...)
      execute: async (sql, params = []) => {
        return adapter.query(sql, params);
      },
      // Transaction helpers to mimic mysql2 beginTransaction/commit/rollback
      beginTransaction: async () => {
        if (txClient) return; // already in a transaction
        txClient = await pool.connect();
        try { await txClient.query('BEGIN'); } catch (e) { txClient.release(); txClient = null; throw e; }
      },
      commit: async () => {
        if (!txClient) return;
        try { await txClient.query('COMMIT'); } finally { txClient.release(); txClient = null; }
      },
      rollback: async () => {
        if (!txClient) return;
        try { await txClient.query('ROLLBACK'); } finally { txClient.release(); txClient = null; }
      },
      // Safe no-op end to avoid shutting down the shared pool per request
      end: async () => {
        // Intentionally no-op. The process shutdown should call pool.end() once if needed.
        return;
      },
      // Expose the underlying pool if ever needed
      _pool: pool,
    };

    return adapter;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
