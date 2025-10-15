const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'lupon_system'
};

// Get all table names from the database
const getAllTables = async (connection) => {
  const [tables] = await connection.execute('SHOW TABLES');
  return tables.map(table => Object.values(table)[0]);
};

// Generate CREATE TABLE statement for a table
const getCreateTableStatement = async (connection, tableName) => {
  try {
    const [result] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
    return result[0]['Create Table'] + ';';
  } catch (error) {
    console.error(`Error getting CREATE statement for table ${tableName}:`, error);
    return `-- Error: Could not generate CREATE statement for table ${tableName}`;
  }
};

// Helper function to get date range based on interval
const getDateRange = (intervalType, dateValue) => {
  const date = new Date(dateValue);
  let startDate, endDate;

  switch (intervalType) {
    case 'monthly':
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      startDate = new Date(date.getFullYear(), quarter * 3, 1);
      endDate = new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    case 'yearly':
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59);
  }

  return { startDate, endDate };
};

// Generate INSERT statements for a table with optional date filtering
const getInsertStatements = async (connection, tableName, dateFilter = null) => {
  try {
    let query = `SELECT * FROM \`${tableName}\``;
    let queryParams = [];
    
    // Apply date filtering for specific tables
    if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
      const { startDate, endDate } = dateFilter;
      
      switch (tableName) {
        case 'complaints':
          query += ' WHERE date_filed BETWEEN ? AND ?';
          queryParams = [startDate, endDate];
          break;
        case 'mediation':
          query += ' WHERE date BETWEEN ? AND ?';
          queryParams = [startDate, endDate];
          break;
        case 'conciliation':
          query += ' WHERE date BETWEEN ? AND ?';
          queryParams = [startDate, endDate];
          break;
        case 'arbitration':
          query += ' WHERE date BETWEEN ? AND ?';
          queryParams = [startDate, endDate];
          break;
        case 'settlement':
          query += ' WHERE settlement_date BETWEEN ? AND ?';
          queryParams = [startDate, endDate];
          break;
        // For other tables, don't apply date filtering
        default:
          break;
      }
    }
    
    const [rows] = await connection.execute(query, queryParams);
    
    if (rows.length === 0) {
      return `-- No data in table ${tableName} for the specified period`;
    }

    const columns = Object.keys(rows[0]);
    const columnNames = columns.map(col => `\`${col}\``).join(', ');
    
    let insertStatements = [];
    
    for (const row of rows) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') {
          // Escape single quotes and backslashes
          return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        }
        if (value instanceof Date) {
          return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }
        return value;
      }).join(', ');
      
      insertStatements.push(`INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});`);
    }
    
    return insertStatements.join('\n');
  } catch (error) {
    console.error(`Error generating INSERT statements for table ${tableName}:`, error);
    return `-- Error: Could not generate INSERT statements for table ${tableName}`;
  }
};

// Get relevant tables based on report type
const getRelevantTables = (reportType) => {
  const tableMapping = {
    'all': ['complaints', 'residents', 'mediation', 'conciliation', 'arbitration', 'settlement', 'users'],
    'mediation': ['mediation', 'mediation_reschedule', 'mediation_documentation', 'complaints', 'residents'],
    'conciliation': ['conciliation', 'conciliation_reschedule', 'conciliation_documentation', 'complaints', 'residents'],
    'arbitration': ['arbitration', 'arbitration_reschedule', 'arbitration_documentation', 'complaints', 'residents'],
    'settlement': ['settlement', 'complaints', 'residents'],
    'withdrawn': ['complaints', 'residents']
  };
  
  return tableMapping[reportType] || tableMapping['all'];
};

// Main function to export database as SQL
const exportDatabaseAsSQL = async (req, res) => {
  let connection;
  
  try {
    console.log('Starting SQL database export...');
    
    // Get report type and interval parameters from query
    const reportType = req.query.reportType || 'all';
    const intervalType = req.query.intervalType; // monthly, quarterly, yearly
    const dateValue = req.query.dateValue; // date value for the interval
    
    console.log(`Export type: ${reportType}`);
    console.log(`Interval type: ${intervalType}`);
    console.log(`Date value: ${dateValue}`);
    
    // Calculate date range if interval filtering is requested
    let dateFilter = null;
    if (intervalType && dateValue) {
      dateFilter = getDateRange(intervalType, dateValue);
      console.log(`Date filter applied: ${dateFilter.startDate} to ${dateFilter.endDate}`);
    }
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    
    // Get relevant tables based on report type
    const relevantTables = getRelevantTables(reportType);
    
    // Get all existing tables and filter to only include relevant ones
    const allTables = await getAllTables(connection);
    const tables = allTables.filter(table => relevantTables.includes(table));
    console.log(`Found ${tables.length} relevant tables for ${reportType}:`, tables);
    
    // Generate SQL content
    let sqlContent = [];
    
    // Add header
    sqlContent.push('-- Lupon Management System Database Export');
    sqlContent.push(`-- Report Type: ${reportType.toUpperCase()}`);
    if (intervalType && dateValue) {
      sqlContent.push(`-- Interval: ${intervalType.toUpperCase()}`);
      sqlContent.push(`-- Period: ${dateFilter.startDate.toISOString().split('T')[0]} to ${dateFilter.endDate.toISOString().split('T')[0]}`);
    }
    sqlContent.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlContent.push('-- Database: lupon_system');
    sqlContent.push('');
    sqlContent.push('SET FOREIGN_KEY_CHECKS = 0;');
    sqlContent.push('');
    
    // Generate CREATE TABLE statements
    sqlContent.push('-- ==========================================');
    sqlContent.push('-- TABLE STRUCTURES');
    sqlContent.push('-- ==========================================');
    sqlContent.push('');
    
    for (const table of tables) {
      console.log(`Generating CREATE statement for table: ${table}`);
      sqlContent.push(`-- Table structure for table \`${table}\``);
      sqlContent.push(`DROP TABLE IF EXISTS \`${table}\`;`);
      const createStatement = await getCreateTableStatement(connection, table);
      sqlContent.push(createStatement);
      sqlContent.push('');
    }
    
    // Generate INSERT statements
    sqlContent.push('-- ==========================================');
    sqlContent.push('-- TABLE DATA');
    sqlContent.push('-- ==========================================');
    sqlContent.push('');
    
    for (const table of tables) {
      console.log(`Generating INSERT statements for table: ${table}`);
      sqlContent.push(`-- Dumping data for table \`${table}\``);
      const insertStatements = await getInsertStatements(connection, table, dateFilter);
      sqlContent.push(insertStatements);
      sqlContent.push('');
    }
    
    // Add footer
    sqlContent.push('SET FOREIGN_KEY_CHECKS = 1;');
    sqlContent.push('');
    sqlContent.push('-- Export completed successfully');
    
    // Join all content
    const finalSQL = sqlContent.join('\n');
    
    // Set response headers for file download
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    let filename = `lupon_${reportType}_export_${timestamp}.sql`;
    
    // Include interval information in filename if provided
    if (intervalType && dateValue) {
      const date = new Date(dateValue);
      let periodStr = '';
      
      switch (intervalType) {
        case 'monthly':
          periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodStr = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          periodStr = `${date.getFullYear()}`;
          break;
        default:
          periodStr = date.toISOString().split('T')[0];
      }
      
      filename = `lupon_${reportType}_${intervalType}_${periodStr}_${timestamp}.sql`;
    }
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(finalSQL, 'utf8'));
    
    console.log(`SQL export completed. File size: ${Buffer.byteLength(finalSQL, 'utf8')} bytes`);
    
    // Send the SQL content
    res.send(finalSQL);
    
  } catch (error) {
    console.error('Error exporting database as SQL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export database as SQL',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get database export summary (for display purposes)
const getDatabaseSummary = async (req, res) => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const tables = await getAllTables(connection);
    const summary = [];
    let totalRecords = 0;
    
    for (const table of tables) {
      const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
      const count = countResult[0].count;
      totalRecords += count;
      
      summary.push({
        table: table,
        records: count
      });
    }
    
    res.json({
      success: true,
      totalTables: tables.length,
      totalRecords: totalRecords,
      tables: summary,
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting database summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database summary',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  exportDatabaseAsSQL,
  getDatabaseSummary
};
