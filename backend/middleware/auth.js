const jwt = require('jsonwebtoken');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'lupon_system_jwt_secret_key_2024';

// Generate JWT Token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h' // Token expires in 24 hours
  });
};

// Verify JWT Token Middleware
const verifyToken = (req, res, next) => {
  try {
    console.log(`🔐 JWT Verification for ${req.method} ${req.path}`);
    
    // Check for token in Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    let token = null;
    
    console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('✅ Token found in Authorization header');
    }
    
    // Fallback: Check for token in cookies (for backward compatibility)
    if (!token && req.cookies.token) {
      token = req.cookies.token;
      console.log('✅ Token found in cookies');
    }
    
    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    console.log('🔍 Verifying token...', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      secretExists: !!JWT_SECRET,
      secretLength: JWT_SECRET?.length || 0
    });
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully for user:', decoded.id);
    req.user = decoded; // Attach user info to request
    next();
    
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Token verification failed.' 
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }
    
    // Convert single role to array for consistency
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }
    
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  requireRole,
  JWT_SECRET
};
