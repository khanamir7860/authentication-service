import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * ============================================================================
 * AUTHENTICATION ROUTE REGISTRY (12 CORE FEATURES)
 * ============================================================================
 */

// 1. User Registration
router.post('/register', authController.register);

// 2. User Login
router.post('/login', authController.login);

// 3. Logout (Revoke Refresh Token)
router.post('/logout', authController.logout);

// 4 & 5. Refresh Access Token (Rotation)
router.post('/refresh-token', authController.refreshToken);

// 6. Email Verification (Supports both GET link click from email and POST)
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

// 7. Forgot Password (Request Reset Link)
router.post('/forgot-password', authController.forgotPassword);

// 8. Reset Password (Submit new password with token)
router.post('/reset-password', authController.resetPassword);

// ----------------------------------------------------------------------------
// PROTECTED ROUTES (Requires Authorization: Bearer <access_token>)
// ----------------------------------------------------------------------------

// 9. Get Authenticated User Profile
router.get('/me', authenticateToken, authController.getProfile);

// 10. Phone Verification: Request OTP
router.post('/send-phone-otp', authenticateToken, authController.sendPhoneOtp);

// 11. Phone Verification: Verify OTP
router.post('/verify-phone-otp', authenticateToken, authController.verifyPhoneOtp);

// 12. Change Password (Authenticated user with current & new password)
router.post('/change-password', authenticateToken, authController.changePassword);

export default router;
