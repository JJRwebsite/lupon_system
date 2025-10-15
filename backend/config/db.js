const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'lupon_system'
};

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('MySQL DB Connected...');
    return connection;
  } catch (err) {
    console.error('Database connection error:', err.message);
    throw err; // Throw the error instead of exiting the process
  }
};

module.exports = connectDB; 