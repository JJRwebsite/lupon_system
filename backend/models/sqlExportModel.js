const connectDB = require('../config/db');

// Get all table names from the database
const getAllTables = async (connection) => {
  const [tables] = await connection.execute(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return tables.map(row => row.table_name);
};

// Generate CREATE TABLE statement for a table
const getCreateTableStatement = async (connection, tableName) => {
  // PostgreSQL does not support SHOW CREATE TABLE; implement later if needed via pg_catalog
  return `-- CREATE TABLE for ${tableName} not implemented for PostgreSQL export`;
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
    let query = `SELECT * FROM ${tableName}`;
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
    const columnNames = columns.join(', ');
    
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
      
      insertStatements.push(`INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`);
    }
    
    return insertStatements.join('\n');
  } catch (error) {
    console.error(`Error generating INSERT statements for table ${tableName}:`, error);
    return `-- Error: Could not generate INSERT statements for table ${tableName}`;
  }
};

// Get relevant tables based on report type
const getRelevantTables = (reportType) => {
  switch (reportType) {
    case 'mediation':
      return ['mediation', 'mediation_reschedule', 'mediation_documentation'];
    case 'conciliation':
      return ['conciliation', 'conciliation_reschedule', 'conciliation_documentation'];
    case 'arbitration':
      return ['arbitration', 'arbitration_reschedule', 'arbitration_documentation'];
    case 'settlement':
      return ['settlement'];
    case 'all':
    default:
      // Export all relevant tables
      return [
        'users', 'residents', 'complaints',
        'mediation', 'mediation_reschedule', 'mediation_documentation',
        'conciliation', 'conciliation_reschedule', 'conciliation_documentation',
        'arbitration', 'arbitration_reschedule', 'arbitration_documentation',
        'settlement', 'notifications', 'referrals'
      ];
  }
};

module.exports = {
  connectDB,
  getAllTables,
  getCreateTableStatement,
  getDateRange,
  getInsertStatements,
  getRelevantTables,
};
