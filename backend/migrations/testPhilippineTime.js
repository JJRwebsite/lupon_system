const connectDB = require('../config/db');

// Simple test to verify Philippine timezone is working
async function testPhilippineTime() {
  const connection = await connectDB();
  try {
    console.log('🇵🇭 Testing Philippine timezone configuration...');
    
    // Set session timezone
    await connection.execute(`SET timezone = 'Asia/Manila'`);
    
    // Test current time in different formats
    const [timeResult] = await connection.execute(`
      SELECT 
        NOW() as current_time,
        CURRENT_TIMESTAMP as current_timestamp,
        TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS TZ') as formatted_time
    `);
    
    console.log('🕐 Current Philippine Time:');
    console.log(`   Database Time: ${timeResult[0].current_time}`);
    console.log(`   Formatted:     ${timeResult[0].formatted_time}`);
    
    // Test inserting a new record to see if it uses Philippine time
    const testId = Math.floor(Math.random() * 1000000);
    await connection.execute(`
      INSERT INTO complaints (id, case_title, case_description) 
      VALUES (?, 'Timezone Test Case', 'Testing Philippine timezone')
    `, [testId]);
    
    const [insertResult] = await connection.execute(`
      SELECT date_filed, TO_CHAR(date_filed, 'YYYY-MM-DD HH24:MI:SS TZ') as formatted_date_filed
      FROM complaints 
      WHERE id = ?
    `, [testId]);
    
    console.log('📝 New record timestamp:');
    console.log(`   Date Filed: ${insertResult[0].date_filed}`);
    console.log(`   Formatted:  ${insertResult[0].formatted_date_filed}`);
    
    // Clean up test record
    await connection.execute(`DELETE FROM complaints WHERE id = ?`, [testId]);
    
    console.log('✅ Philippine timezone test completed successfully!');
    
  } catch (err) {
    console.error('❌ Timezone test failed:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Run test if called directly
if (require.main === module) {
  testPhilippineTime()
    .then(() => {
      console.log('🎉 Timezone test completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Timezone test failed:', err);
      process.exit(1);
    });
}

module.exports = { testPhilippineTime };
