const connectDB = require('../config/db');

// Migration to set Philippine timezone for the database session and update defaults
async function setPhilippineTimezone() {
  const connection = await connectDB();
  try {
    console.log('🇵🇭 Setting Philippine timezone (Asia/Manila) for database...');
    
    // Set the session timezone to Philippine time
    await connection.execute(`SET timezone = 'Asia/Manila'`);
    console.log('✅ Session timezone set to Asia/Manila');
    
    // Update default values for existing tables to use Philippine timezone
    console.log('🔄 Updating table defaults to use Philippine timezone...');
    
    // Update complaints table defaults
    try {
      await connection.execute(`
        ALTER TABLE complaints 
        ALTER COLUMN date_filed SET DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
      `);
      console.log('✅ Updated complaints.date_filed default');
    } catch (err) {
      console.log('⚠️  Could not update complaints.date_filed default:', err.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE complaints 
        ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
      `);
      console.log('✅ Updated complaints.created_at default');
    } catch (err) {
      console.log('⚠️  Could not update complaints.created_at default:', err.message);
    }
    
    // Update users table defaults
    try {
      await connection.execute(`
        ALTER TABLE users 
        ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
      `);
      console.log('✅ Updated users.created_at default');
    } catch (err) {
      console.log('⚠️  Could not update users.created_at default:', err.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE users 
        ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
      `);
      console.log('✅ Updated users.updated_at default');
    } catch (err) {
      console.log('⚠️  Could not update users.updated_at default:', err.message);
    }
    
    // Test the current time in Philippine timezone
    const [timeResult] = await connection.execute(`
      SELECT 
        NOW() as utc_time,
        NOW() AT TIME ZONE 'Asia/Manila' as ph_time,
        EXTRACT(TIMEZONE_HOUR FROM NOW() AT TIME ZONE 'Asia/Manila') as timezone_offset
    `);
    
    console.log('🕐 Current time check:');
    console.log(`   UTC Time: ${timeResult[0].utc_time}`);
    console.log(`   PH Time:  ${timeResult[0].ph_time}`);
    console.log(`   Timezone Offset: +${timeResult[0].timezone_offset} hours`);
    
    console.log('🎉 Philippine timezone configuration completed!');
    
  } catch (err) {
    console.error('❌ Timezone migration failed:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  setPhilippineTimezone()
    .then(() => {
      console.log('🎉 Timezone migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Timezone migration failed:', err);
      process.exit(1);
    });
}

module.exports = { setPhilippineTimezone };
