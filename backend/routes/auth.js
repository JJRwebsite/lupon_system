const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/test-db', authController.testDb);
router.get('/setup', authController.setupAccounts);
router.get('/update-passwords', authController.updatePasswords);
router.get('/generate-hashed-queries', authController.generateHashedQueries);
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
// Email verification
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendVerificationCode);

// Private routes (will add middleware later for protection)
router.get('/current-user', authController.getCurrentUser);
router.post('/generate-jwt', authController.generateJwtFromCookie);
router.put('/update-user', verifyToken, authController.updateUser);
router.put('/update-password', verifyToken, authController.updatePassword);
router.post('/logout', authController.logoutUser);

module.exports = router;