const connectDB = require('../config/db');

// Migration function to update users table structure
async function migrateUsersTable() {
  try {
    const connection = await connectDB();
    
    // Ensure users table exists in Postgres; skip if it doesn't
    const [tbl] = await connection.execute("SELECT to_regclass('public.users') AS exists");
    if (!tbl || !tbl[0] || !tbl[0].exists) {
      console.log('Users table does not exist; skipping users migration.');
      await connection.end();
      return;
    }

    // Check if migration is needed by checking if 'purok' column exists (PostgreSQL)
    const [columns] = await connection.execute(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'purok'
    `);
    
    if (columns.length === 0) {
      console.log('Starting users table migration...');
      
      // Step 1: Add new columns
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS purok TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS municipality VARCHAR(100) NOT NULL DEFAULT ''
      `);
      console.log('✓ Added new columns: purok, municipality');
      
      // Step 2: Migrate existing data
      // Only update from old columns if they exist
      const [addrCol] = await connection.execute(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'address'
      `);
      const [cityCol] = await connection.execute(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'city'
      `);
      if (addrCol.length > 0) {
        await connection.execute(`UPDATE users SET purok = address WHERE address IS NOT NULL`);
      }
      if (cityCol.length > 0) {
        await connection.execute(`UPDATE users SET municipality = city WHERE city IS NOT NULL`);
      }
      console.log('✓ Migrated existing data to new columns');
      
      // Step 3: Remove old columns
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS address,
        DROP COLUMN IF EXISTS city, 
        DROP COLUMN IF EXISTS province
      `);
      console.log('✓ Removed old columns: address, city, province');
      
      console.log('Users table migration completed successfully!');
    } else {
      console.log('Users table migration already completed.');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Users table migration failed:', error);
    throw error;
  }
}

module.exports = { migrateUsersTable };

