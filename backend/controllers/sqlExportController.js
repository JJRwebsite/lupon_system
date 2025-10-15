const path = require('path');
const {
  connectDB,
  getAllTables,
  getCreateTableStatement,
  getDateRange,
  getInsertStatements,
  getRelevantTables,
} = require('../models/sqlExportModel');

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
    connection = await connectDB();
    
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
    connection = await connectDB();
    
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
