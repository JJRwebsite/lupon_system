const connectDB = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { sendVerificationCode, maskEmail } = require('../services/mailer');

// @route   GET /api/test-db
// @desc    Test Database Connection and Verify/Create Users Table
// @access  Public
exports.testDb = async (req, res) => {
  try {
    const connection = await connectDB();
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');

    if (tables.length === 0) {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          last_name VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          middle_name VARCHAR(255),
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          birth_date DATE NOT NULL,
          gender VARCHAR(50) NOT NULL,
          purok TEXT NOT NULL,
          barangay VARCHAR(255) NOT NULL,
          municipality VARCHAR(255) NOT NULL,
          contact VARCHAR(50),
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          verification_code VARCHAR(10),
          verification_expires DATETIME,
          is_verified TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    // Ensure verification columns exist on existing deployments
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)");
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires DATETIME");
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0");
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS contact VARCHAR(50)");

    await connection.end();
    res.json({ success: true, message: 'Database connection successful and users table verified' });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
};

// @route   POST /api/verify-email
// @desc    Verify user's email with code
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const connection = await connectDB();
    const [rows] = await connection.execute('SELECT id, verification_code, verification_expires, is_verified FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = rows[0];
    if (Number(u.is_verified) === 1) {
      await connection.end();
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Check expiry
    const [nowRow] = await connection.execute('SELECT NOW() as now');
    const now = nowRow[0].now;
    if (!u.verification_code || !u.verification_expires || new Date(now) > new Date(u.verification_expires)) {
      await connection.end();
      return res.status(400).json({ success: false, message: 'Verification code expired. Please resend a new code.' });
    }

    if (String(u.verification_code) !== String(code)) {
      await connection.end();
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    await connection.execute('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE email = ?', [email]);
    await connection.end();
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email', error: error.message });
  }
};

// @route   POST /api/resend-code
// @desc    Resend verification code
// @access  Public
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const connection = await connectDB();
    // Generate new code and expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const [expiryRow] = await connection.execute("SELECT NOW() + INTERVAL 10 MINUTE AS exp");
    const expiresAt = expiryRow[0].exp;

    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await connection.execute('UPDATE users SET verification_code = ?, verification_expires = ?, is_verified = 0 WHERE email = ?', [code, expiresAt, email]);
    await connection.end();

    try {
      await sendVerificationCode(email, code, 10);
    } catch (mailErr) {
      console.error('Email send error:', mailErr.message);
    }

    res.json({ success: true, message: 'Verification code resent', emailMasked: maskEmail(email) });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification code', error: error.message });
  }
};

// @route   GET /api/setup
// @desc    Setup Admin/Secretary Accounts
// @access  Public (for initial setup only)
exports.setupAccounts = async (req, res) => {
  try {
    const connection = await connectDB();
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('password123', salt);
    const secretaryPassword = await bcrypt.hash('password123', salt);

    const [adminRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@lupon.com']);
    if (adminRows.length === 0) {
      await connection.execute(
        `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, purok, barangay, municipality, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Admin', 'System', '', 'admin@lupon.com', adminPassword, '2000-01-01', 'Male', 'System Purok', 'System Barangay', 'System Municipality', 'admin']
      );
    }

    const [secretaryRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['secretary@lupon.com']);
    if (secretaryRows.length === 0) {
      await connection.execute(
        `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, purok, barangay, municipality, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Secretary', 'System', '', 'secretary@lupon.com', secretaryPassword, '2000-01-01', 'Female', 'System Purok', 'System Barangay', 'System Municipality', 'secretary']
      );
    }

    await connection.end();
    res.json({ success: true, message: 'Admin and secretary accounts created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: 'Setup failed', error: error.message });
  }
};

// @route   GET /api/update-passwords
// @desc    Update Existing Plain-Text Passwords to Hashed
// @access  Public (for one-time use)
exports.updatePasswords = async (req, res) => {
  try {
    const connection = await connectDB();
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('password123', salt);
    const secretaryPassword = await bcrypt.hash('password123', salt);

    await connection.execute('UPDATE users SET password = ? WHERE email = ?', [adminPassword, 'admin@lupon.com']);
    await connection.execute('UPDATE users SET password = ? WHERE email = ?', [secretaryPassword, 'secretary@lupon.com']);

    await connection.end();
    res.json({ success: true, message: 'Admin and secretary passwords updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Password update failed', error: error.message });
  }
};

// @route   GET /api/generate-hashed-queries
// @desc    Generate SQL Queries for Hashed Admin/Secretary Passwords
// @access  Public
exports.generateHashedQueries = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const secretaryPassword = await bcrypt.hash('secretary123', salt);

    const queries = `
-- Admin Account
INSERT INTO users (
    last_name,
    first_name,
    middle_name,
    email,
    password,
    birth_date,
    gender,
    address,
    barangay,
    city,
    province,
    role
) VALUES (
    'Administrator',
    'System',
    '',
    'administrator@lupon.com',
    '${adminPassword}',
    '2000-01-01',
    'Male',
    'System Address',
    'System Barangay',
    'System City',
    'System Province',
    'admin'
);

-- Secretary Account
INSERT INTO users (
    last_name,
    first_name,
    middle_name,
    email,
    password,
    birth_date,
    gender,
    address,
    barangay,
    city,
    province,
    role
) VALUES (
    'Secretary',
    'System',
    '',
    'secretary2@lupon.com',
    '${secretaryPassword}',
    '2000-01-01',
    'Female',
    'System Address',
    'System Barangay',
    'System City',
    'System Province',
    'secretary'
);`;

    res.json({ 
      success: true, 
      message: 'SQL queries generated successfully',
      queries: queries,
      credentials: {
        admin: { email: 'administrator@lupon.com', password: 'admin123' },
        secretary: { email: 'secretary2@lupon.com', password: 'secretary123' }
      }
    });
  } catch (error) {
    console.error('Query generation error:', error);
    res.status(500).json({ success: false, message: 'Query generation failed', error: error.message });
  }
};

// @route   POST /api/register
// @desc    Register a new user
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const {
      lastName, firstName, middleName, email, password, birthDate, gender, purok, barangay, municipality, contact, role = 'user'
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const connection = await connectDB();
    // Ensure verification columns exist (best-effort; ignore if not supported)
    try { await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)"); } catch(_) {}
    try { await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires DATETIME"); } catch(_) {}
    try { await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0"); } catch(_) {}
    // Ensure contact column exists to avoid insert failures when it's missing
    try { await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS contact VARCHAR(50)"); } catch(_) {}

    // Check for existing email
    const [existing] = await connection.execute('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    // Generate 6-digit code and expiry (10 minutes)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const [expiryRow] = await connection.execute("SELECT NOW() + INTERVAL 10 MINUTE AS exp");
    const expiresAt = expiryRow[0].exp;

    if (existing.length > 0) {
      const userRow = existing[0];
      // If user exists but not verified, resend code and allow frontend to move to verification step
      if (Number(userRow.is_verified) !== 1 && role === 'user') {
        await connection.execute('UPDATE users SET verification_code = ?, verification_expires = ? WHERE email = ?', [code, expiresAt, email]);
        await connection.end();
        try { await sendVerificationCode(email, code, 10); } catch (mailErr) { console.error('Email send error:', mailErr.message); }
        return res.json({ success: true, message: 'Account exists but not verified. New verification code sent.', emailMasked: maskEmail(email) });
      }
      await connection.end();
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    // code and expiresAt already generated above

    const [result] = await connection.execute(
      `INSERT INTO users (last_name, first_name, middle_name, email, password, birth_date, gender, purok, barangay, municipality, contact, role, verification_code, verification_expires, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [lastName, firstName, middleName, email, hashedPassword, birthDate, gender, purok, barangay, municipality, contact || '', role, code, expiresAt]
    );

    // Option A: Auto-create or link a Resident record for this user
    try {
      // Ensure residents table has a user_id column for linkage (no-op if already exists)
      try { await connection.execute("ALTER TABLE residents ADD COLUMN IF NOT EXISTS user_id INT"); } catch (_) {}

      const firstUpper = (firstName || '').toString().trim().toUpperCase();
      const lastUpper = (lastName || '').toString().trim().toUpperCase();
      const middleUpper = (middleName || '').toString().trim().toUpperCase();

      // Try to find existing resident by name + location
      const [existingResident] = await connection.execute(
        'SELECT id, user_id FROM residents WHERE firstname = ? AND lastname = ? AND purok = ? AND barangay = ? LIMIT 1',
        [firstUpper, lastUpper, purok, barangay]
      );

      const newUserId = result.insertId;

      if (existingResident.length > 0) {
        const r = existingResident[0];
        // Link resident to this user if not already linked
        // Link and backfill contact only if resident has no linked user yet.
        if (r.user_id == null) {
          await connection.execute('UPDATE residents SET user_id = ?, contact = IFNULL(contact, ?) WHERE id = ?', [newUserId, contact || '', r.id]);
        }
      } else {
        // Create a new resident record linked to this user
        // Note: residents table columns: firstname, lastname, middlename, purok, contact, barangay, (user_id)
        await connection.execute(
          'INSERT INTO residents (firstname, lastname, middlename, purok, contact, barangay, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [firstUpper, lastUpper, middleUpper, purok, contact || '', barangay, newUserId]
        );
      }
    } catch (resErr) {
      // Do not fail user registration if resident creation/linking has issues
      console.error('Auto-create/link Resident error:', resErr.message);
    }

    await connection.end();

    // Send verification email for regular users only
    if (role === 'user') {
      try {
        await sendVerificationCode(email, code, 10);
      } catch (mailErr) {
        console.error('Email send error:', mailErr.message);
      }
      return res.json({ success: true, message: 'User registered. Verification code sent to email.', emailMasked: maskEmail(email) });
    }

    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// @route   POST /api/login
// @desc    Authenticate user & get JWT token
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const connection = await connectDB();
    console.log('Database connected, querying for user...');

    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    await connection.end();

    if (rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = rows[0];
    console.log('User found:', { ...user, password: '[REDACTED]' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    // Require email verification for regular users only
    if ((user.role === 'user' || !user.role) && Number(user.is_verified) !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your email for the verification code.'
      });
    }

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    // Set JWT token in HTTP-only cookie for security
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      path: '/'
    });

    console.log('Login successful for user:', email);
    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      user: userWithoutPassword,
      token: token // Also send token in response for frontend storage
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login', 
      error: error.message 
    });
  }
};

// @route   GET /api/current-user
// @desc    Get logged-in user data from JWT token
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    // Check for JWT token in Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated - no token provided' });
    }
    
    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Optionally fetch fresh user data from database
    const connection = await connectDB();
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = rows[0];
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ success: true, user: userWithoutPassword });

  } catch (error) {
    console.error('Get current user error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    
    res.status(500).json({ success: false, message: 'Failed to get user data', error: error.message });
  }
}; 

// @route   PUT /api/update-user
// @desc    Update user profile information
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    // Accept both new and legacy field names for backward compatibility
    const {
      firstName,
      middleName,
      lastName,
      email,
      birthDate,
      gender,
      purok,
      barangay,
      municipality,
      contact,
      // legacy fallbacks
      address,
      city,
      province
    } = req.body;

    // Determine userId from (1) req.user (if middleware used), (2) cookie 'user', (3) JWT token
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    }
    if (!userId && req.cookies && req.cookies.user) {
      try {
        const currentUser = JSON.parse(req.cookies.user);
        userId = currentUser?.id || null;
      } catch {}
    }

    if (!userId) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const authHeader = req.headers.authorization || '';
        let token = null;
        if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
        if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
        if (token) {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded?.id || null;
        }
      } catch (e) {
        // ignore, will handle unauthenticated below
      }
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const connection = await connectDB();

    // Use new schema columns if present; fallback to legacy names
    const nextPurok = (purok ?? address) || null;
    const nextMunicipality = (municipality ?? city) || null;
    const nextContact = contact ?? null;

    // Build dynamic update with new columns (purok, municipality, contact)
    await connection.execute(
      `UPDATE users SET 
        first_name = ?, 
        middle_name = ?, 
        last_name = ?, 
        email = ?, 
        birth_date = ?, 
        gender = ?, 
        purok = ?, 
        barangay = ?, 
        municipality = ?, 
        contact = ?
      WHERE id = ?`,
      [firstName, middleName, lastName, email, birthDate, gender, nextPurok, barangay, nextMunicipality, nextContact, userId]
    );

    // Fetch updated user data
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedUser = rows[0];
    const { password: _, ...userWithoutPassword } = updatedUser;

    // Update the cookie with new user data for continuity
    res.cookie('user', JSON.stringify(userWithoutPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      path: '/',
      domain: 'localhost'
    });

    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
}; 

// @route   PUT /api/update-password
// @desc    Update user password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user from cookie
    const userCookie = req.cookies.user;
    if (!userCookie) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const currentUser = JSON.parse(userCookie);
    const userId = currentUser.id;

    const connection = await connectDB();
    
    // Get current user data to verify current password
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      await connection.end();
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    await connection.end();

    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update password', 
      error: error.message 
    });
  }
};

// @route   POST /api/generate-jwt
// @desc    Generate JWT token for users already authenticated with cookies
// @access  Private
exports.generateJwtFromCookie = async (req, res) => {
  try {
    // Check if user is authenticated via cookies
    const userCookie = req.cookies.user;
    if (!userCookie) {
      return res.status(401).json({ success: false, message: 'Not authenticated with cookies' });
    }

    const user = JSON.parse(userCookie);
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set JWT token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ 
      success: true, 
      message: 'JWT token generated successfully',
      token: token,
      user: user
    });
  } catch (error) {
    console.error('Generate JWT error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate JWT token', 
      error: error.message 
    });
  }
};

// @route   POST /api/logout
// @desc    Logout user and clear JWT token
// @access  Private
exports.logoutUser = async (req, res) => {
  try {
    // Clear JWT token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Also clear user cookie for backward compatibility
    res.clearCookie('user');
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to logout', 
      error: error.message 
    });
  }
};