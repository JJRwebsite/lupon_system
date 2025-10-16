const connectDB = require('../config/db');

// Migration to fix date_filed column from DATE to TIMESTAMP
async function fixDateFiledTimestamp() {
  const connection = await connectDB();
  try {
    console.log('🔄 Starting date_filed column type migration...');
    
    // Check if the column exists and its current type
    const [columnInfo] = await connection.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'complaints' AND column_name = 'date_filed'
    `);
    
    if (columnInfo.length > 0) {
      const currentType = columnInfo[0].data_type;
      console.log(`📋 Current date_filed column type: ${currentType}`);
      
      if (currentType === 'date') {
        console.log('🔧 Converting date_filed from DATE to TIMESTAMP...');
        
        // Step 1: Add a temporary column with TIMESTAMP type
        await connection.execute(`
          ALTER TABLE complaints 
          ADD COLUMN IF NOT EXISTS date_filed_temp TIMESTAMP
        `);
        
        // Step 2: Copy data from date_filed to date_filed_temp, converting to timestamp
        // For existing DATE values, we'll set them to noon (12:00:00) to avoid midnight confusion
        await connection.execute(`
          UPDATE complaints 
          SET date_filed_temp = date_filed + INTERVAL '12 hours'
          WHERE date_filed_temp IS NULL
        `);
        
        // Step 3: Drop the old column
        await connection.execute(`ALTER TABLE complaints DROP COLUMN date_filed`);
        
        // Step 4: Rename the temp column to date_filed
        await connection.execute(`
          ALTER TABLE complaints 
          RENAME COLUMN date_filed_temp TO date_filed
        `);
        
        // Step 5: Set default value for new records
        await connection.execute(`
          ALTER TABLE complaints 
          ALTER COLUMN date_filed SET DEFAULT NOW()
        `);
        
        console.log('✅ Successfully converted date_filed to TIMESTAMP type');
      } else if (currentType === 'timestamp without time zone' || currentType === 'timestamp') {
        console.log('✅ date_filed column is already TIMESTAMP type - no migration needed');
      } else {
        console.log(`⚠️  Unexpected column type: ${currentType}`);
      }
    } else {
      console.log('❌ date_filed column not found in complaints table');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  fixDateFiledTimestamp()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { fixDateFiledTimestamp };
