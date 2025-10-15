require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const mediationUploadsDir = path.join(uploadsDir, 'mediation');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(mediationUploadsDir)) {
  fs.mkdirSync(mediationUploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // For parsing application/json
app.use(cookieParser()); // Use cookie-parser middleware

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from assets directory
app.use('/api/assets', express.static(path.join(__dirname, 'assets')));

// Add specific handling for old uploaded files (without extensions)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  
  // Check if file exists without extension
  if (fs.existsSync(filePath)) {
    // Try to determine content type based on file content
    const fileBuffer = fs.readFileSync(filePath);
    
    // Check for common image file signatures
    if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
      res.contentType('image/jpeg');
    } else if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
      res.contentType('image/png');
    } else if (fileBuffer[0] === 0x47 && fileBuffer[1] === 0x49) {
      res.contentType('image/gif');
    } else {
      res.contentType('image/jpeg'); // Default to JPEG
    }
    
    res.send(fileBuffer);
  } else {
    next();
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const complaintsController = require('./controllers/complaintsController');
const mediationRoutes = require('./routes/mediation');
const membersRoutes = require('./routes/members');
const secretaryRoutes = require('./routes/secretary');
const chairpersonRoutes = require('./routes/chairperson');
const conciliationRoutes = require('./routes/conciliation');
const arbitrationRoutes = require('./routes/arbitration');
const settlementRoutes = require('./routes/settlement');
const residentsRoutes = require('./routes/residents');
const userDashboardRoutes = require('./routes/userDashboard');
const adminDashboardRoutes = require('./routes/adminDashboard');
const referralsRoutes = require('./routes/referrals');
const referralsController = require('./controllers/referralsController');
const notificationsRoutes = require('./routes/notifications');
const pdfRoutes = require('./routes/pdf');
const backupRoutes = require('./routes/backup');
const sqlExportRoutes = require('./routes/sqlExport');



// Use API routes
app.use('/api', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/mediation', mediationRoutes);
app.use('/api/lupon-members', membersRoutes);
app.use('/api/lupon-secretary', secretaryRoutes);
app.use('/api/lupon-chairperson', chairpersonRoutes);
app.use('/api/conciliation', conciliationRoutes);
app.use('/api/arbitration', arbitrationRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/user-dashboard', userDashboardRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/sql-export', sqlExportRoutes);



// Add status column to complaints table
complaintsController.addStatusColumn().catch(console.error);



// Create referrals table
referralsController.createReferralsTable().catch(console.error);



// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lupon_system'
};

// Test DB Connection Route
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');

    if (tables.length === 0) {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          last_name VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          middle_name VARCHAR(255),
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT =>',
          birth_date DATE NOT NULL,
          gender VARCHAR(50) NOT NULL,
          address TEXT NOT NULL,
          barangay VARCHAR(255) NOT NULL,
          city VARCHAR(255) NOT NULL,
          province VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    await connection.end();
    res.json({ success: true, message: 'Database connection successful and users table verified' });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Setup Admin/Secretary Accounts Route
app.get('/api/setup', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('password123', salt);
    const secretaryPassword = await bcrypt.hash('password123', salt);

    const [adminRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@lupon.com']);
    if (adminRows.length === 0) {
      await connection.execute(
        `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, address, barangay, city, province, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Admin', 'System', '', 'admin@lupon.com', adminPassword, '2000-01-01', 'Male', 'System Address', 'System Barangay', 'System City', 'System Province', 'admin']
      );
    }

    const [secretaryRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['secretary@lupon.com']);
    if (secretaryRows.length === 0) {
      await connection.execute(
        `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, address, barangay, city, province, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Secretary', 'System', '', 'secretary@lupon.com', secretaryPassword, '2000-01-01', 'Female', 'System Address', 'System Barangay', 'System City', 'System Province', 'secretary']
      );
    }

    await connection.end();
    res.json({ success: true, message: 'Admin and secretary accounts created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: 'Setup failed', error: error.message });
  }
});

// Update Passwords Route (for existing plain-text passwords)


// User Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const {
      lastName, firstName, middleName, email, password, birthDate, gender, address, barangay, city, province, role = 'user'
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, address, barangay, city, province, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lastName, firstName, middleName, email, hashedPassword, birthDate, gender, address, barangay, city, province, role]
    );

    await connection.end();
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});


// User Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    await connection.end();

    if (rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    console.log('User found:', { ...user, password: '[REDACTED]' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { password: _, ...userWithoutPassword } = user;

    // For Express, we typically use cookie-parser to handle cookies,
    // but for now, we'll return the user data and the frontend will handle
    // storing it (e.g., in localStorage or via a secure client-side cookie library).
    res.json({ success: true, message: 'Login successful', user: userWithoutPassword });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Import migration function
const { migrateUsersTable } = require('./migrations/migrateUsersTable');

// Start the server with migration
const server = app.listen(PORT, () => {
  console.log(`Express.js server running on port ${PORT}`);
  
  // Run database migration in background without blocking server
  setTimeout(() => {
    migrateUsersTable().catch(error => {
      console.error('Migration failed:', error);
      // Don't let migration errors crash the server
    });
  }, 1000);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

 