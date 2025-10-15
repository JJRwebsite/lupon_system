const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lupon_system'
};

// Helper function to escape SQL values
const escapeSQLValue = (value) => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  return value.toString();
};

// Generate CREATE TABLE statement
const generateCreateTableSQL = (tableName, structure) => {
  let sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
  
  const columns = structure.map(col => {
    let columnDef = `  \`${col.Field}\` ${col.Type}`;
    
    if (col.Null === 'NO') {
      columnDef += ' NOT NULL';
    }
    
    if (col.Default !== null && col.Default !== undefined) {
      if (col.Default === 'CURRENT_TIMESTAMP') {
        columnDef += ' DEFAULT CURRENT_TIMESTAMP';
      } else {
        columnDef += ` DEFAULT ${escapeSQLValue(col.Default)}`;
      }
    }
    
    if (col.Extra) {
      columnDef += ` ${col.Extra.toUpperCase()}`;
    }
    
    return columnDef;
  });
  
  sql += columns.join(',\n');
  
  // Add primary key if exists
  const primaryKey = structure.find(col => col.Key === 'PRI');
  if (primaryKey) {
    sql += `,\n  PRIMARY KEY (\`${primaryKey.Field}\`)`;
  }
  
  sql += '\n);\n\n';
  return sql;
};

// Generate INSERT statements
const generateInsertSQL = (tableName, data, structure) => {
  if (!data || data.length === 0) {
    return `-- No data to insert for table ${tableName}\n\n`;
  }
  
  const columns = structure.map(col => col.Field);
  let sql = `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES\n`;
  
  const values = data.map(row => {
    const rowValues = columns.map(col => escapeSQLValue(row[col]));
    return `(${rowValues.join(', ')})`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  
  return sql;
};

// Get all system data for backup as SQL
const getAllSystemData = async (req, res) => {
  let connection;
  
  try {
    console.log('Starting SQL backup...');
    connection = await mysql.createConnection(dbConfig);
    
    // Define all tables to backup
    const tablesToBackup = [
      'users',
      'residents', 
      'complaints',
      'mediation',
      'mediation_reschedule',
      'mediation_documentation',
      'conciliation',
      'conciliation_reschedule', 
      'conciliation_documentation',
      'arbitration',
      'arbitration_reschedule',
      'arbitration_documentation',
      'settlement',
      'notifications',
      'referrals',
      'lupon_members',
      'lupon_chairperson',
      'lupon_secretary'
    ];

    // Start building SQL dump
    let sqlDump = `-- Lupon System Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${process.env.DB_NAME || 'lupon_system'}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    let totalRecords = 0;
    let successfulTables = 0;
    let tablesWithErrors = [];

    // Backup each table
    for (const table of tablesToBackup) {
      try {
        console.log(`Backing up table: ${table}`);
        
        // Get table structure
        const [structure] = await connection.execute(`DESCRIBE ${table}`);
        
        // Get table data
        const [data] = await connection.execute(`SELECT * FROM ${table}`);
        
        // Add DROP and CREATE statements
        sqlDump += `-- Table: ${table}\n`;
        sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        sqlDump += generateCreateTableSQL(table, structure);
        
        // Add INSERT statements
        if (data.length > 0) {
          sqlDump += `-- Data for table ${table}\n`;
          sqlDump += generateInsertSQL(table, data, structure);
          totalRecords += data.length;
        } else {
          sqlDump += `-- No data for table ${table}\n\n`;
        }
        
        successfulTables++;
        console.log(`✓ Backed up ${table}: ${data.length} records`);
        
      } catch (tableError) {
        console.log(`⚠ Warning: Could not backup table ${table}:`, tableError.message);
        sqlDump += `-- ERROR: Could not backup table ${table}: ${tableError.message}\n\n`;
        tablesWithErrors.push(table);
      }
    }
    
    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    sqlDump += `-- Backup completed\n`;
    sqlDump += `-- Total tables: ${successfulTables}\n`;
    sqlDump += `-- Total records: ${totalRecords}\n`;
    sqlDump += `-- Tables with errors: ${tablesWithErrors.length}\n`;
    
    if (tablesWithErrors.length > 0) {
      sqlDump += `-- Error tables: ${tablesWithErrors.join(', ')}\n`;
    }

    console.log('SQL backup completed successfully!');
    console.log(`Total records backed up: ${totalRecords}`);
    
    res.json({
      success: true,
      message: 'SQL backup completed successfully',
      data: {
        sqlDump: sqlDump,
        statistics: {
          totalTables: successfulTables,
          totalRecords: totalRecords,
          tablesWithData: successfulTables,
          tablesWithErrors: tablesWithErrors.length,
          errorTables: tablesWithErrors
        }
      }
    });

  } catch (error) {
    console.error('SQL backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create SQL backup',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get backup summary (lightweight version for quick status check)
const getBackupSummary = async (req, res) => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const summary = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    const tablesToCheck = [
      'users', 'residents', 'complaints', 'mediation', 'conciliation', 
      'arbitration', 'settlement', 'notifications', 'referrals',
      'lupon_members', 'lupon_chairperson', 'lupon_secretary'
    ];

    for (const table of tablesToCheck) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        summary.tables[table] = result[0].count;
      } catch (error) {
        summary.tables[table] = 0;
      }
    }

    const totalRecords = Object.values(summary.tables).reduce((sum, count) => sum + count, 0);
    
    res.json({
      success: true,
      summary: {
        database: dbConfig.database,
        totalTables: Object.keys(summary.tables).length,
        totalRecords: totalRecords,
        timestamp: summary.timestamp,
        tables: Object.entries(summary.tables).map(([tableName, count]) => ({
          tableName,
          rowCount: count
        }))
      }
    });

  } catch (error) {
    console.error('Backup summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup summary',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  getAllSystemData,
  getBackupSummary
};
