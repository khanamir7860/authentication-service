import authService from '../services/authService.js';

/**
 * ============================================================================
 * AUTH CONTROLLER (ALL 12 ENDPOINTS)
 * ============================================================================
 */
class AuthController {
  /**
   * 1. Register User
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, username, email, phone, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide username, email, and password.',
        });
      }

      const displayName = name || username;
      const result = await authService.register({ name: displayName, username, email, phone, password });

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. Login User
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email/username and password.',
        });
      }

      const result = await authService.login({ emailOrUsername, password });

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. Logout (Invalidate Session / Refresh Token)
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4 & 5. Refresh Access Token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshAccessToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        tokens,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. Verify Email Address
   * GET or POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      const result = await authService.verifyEmail(token);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. Phone Verification - Send OTP
   * POST /api/auth/send-phone-otp
   */
  async sendPhoneOtp(req, res, next) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required.' });
      }

      const result = await authService.sendPhoneOtp(req.user.id, phone);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. Phone Verification - Verify OTP
   * POST /api/auth/verify-phone-otp
   */
  async verifyPhoneOtp(req, res, next) {
    try {
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, error: 'OTP code is required.' });
      }

      const result = await authService.verifyPhoneOtp(req.user.id, otp);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 9. Forgot Password (Request Reset Link)
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }

      const result = await authService.forgotPassword(email);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. Reset Password (Using Reset Token)
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword({ token, newPassword });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 11. Change Password (Authenticated User)
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 12. Get Authenticated User Profile
   * GET /api/auth/me
   */
  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        user: profile,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
