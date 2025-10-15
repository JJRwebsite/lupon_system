const connectDB = require('../config/db');

// Migration function to update users table structure
async function migrateUsersTable() {
  try {
    const connection = await connectDB();
    
    // Check if migration is needed by checking if 'purok' column exists
    const [columns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'purok'");
    
    if (columns.length === 0) {
      console.log('Starting users table migration...');
      
      // Step 1: Add new columns
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN purok TEXT NOT NULL DEFAULT '' AFTER gender,
        ADD COLUMN municipality VARCHAR(100) NOT NULL DEFAULT '' AFTER barangay
      `);
      console.log('✓ Added new columns: purok, municipality');
      
      // Step 2: Migrate existing data
      await connection.execute(`
        UPDATE users SET 
          purok = address,
          municipality = city
      `);
      console.log('✓ Migrated existing data to new columns');
      
      // Step 3: Remove old columns
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN address,
        DROP COLUMN city, 
        DROP COLUMN province
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
