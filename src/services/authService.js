import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import tokenService from './tokenService.js';
import notificationService from './notificationService.js';
import config from '../config/index.js';

/**
 * ============================================================================
 * CORE AUTHENTICATION SERVICE (ALL 12 FEATURES IMPLEMENTATION)
 * ============================================================================
 */
class AuthService {
  /**
   * 1. USER REGISTRATION
   */
  async register({ name, username, email, phone, password }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check uniqueness
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { username: cleanUsername },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      let field = 'Email';
      if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) field = 'Username';
      if (phone && existing.phone === phone) field = 'Phone number';
      const error = new Error(`${field} is already in use.`);
      error.statusCode = 409;
      throw error;
    }

    // Generate Email Verification Token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + config.security.emailVerificationExpiryHours * 60 * 60 * 1000);

    // Create User (password is automatically hashed by User model hook)
    const newUser = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      password_hash: password,
      email_verification_token: emailVerificationToken,
      email_verification_expires: emailVerificationExpires,
    });

    // Send verification email
    await notificationService.sendVerificationEmail(cleanEmail, emailVerificationToken);

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(newUser);
    const refreshToken = await tokenService.generateRefreshToken(newUser);

    return {
      user: newUser.toJSON(),
      token: accessToken,
      tokens: {
        accessToken,
        refreshToken,
      },
      message: 'Registration successful! Please check your email to verify your account.',
    };
  }

  /**
   * 2. USER LOGIN
   */
  async login({ emailOrUsername, password }) {
    const identifier = emailOrUsername.trim().toLowerCase();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      const error = new Error('Invalid email/username or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email/username or password.');
      error.statusCode = 401;
      throw error;
    }

    // Generate short-lived Access Token & long-lived Refresh Token
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user);

    return {
      user: user.toJSON(),
      token: accessToken,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * 3. LOGOUT (INVALIDATE REFRESH TOKEN)
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * 4 & 5. REFRESH TOKEN (ROTATE TOKENS)
   */
  async refreshAccessToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 400;
      throw error;
    }

    const tokenRecord = await RefreshToken.findOne({ where: { token: oldRefreshToken } });
    if (!tokenRecord || !tokenRecord.isActive) {
      const error = new Error('Refresh token is expired, invalid, or already revoked.');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findByPk(tokenRecord.user_id);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // Rotate refresh token (revoke old, create new)
    const newRefreshToken = await tokenService.verifyAndRotateRefreshToken(oldRefreshToken, user);
    const newAccessToken = tokenService.generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 6. EMAIL VERIFICATION
   */
  async verifyEmail(token) {
    if (!token) {
      const error = new Error('Verification token is required.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({
      where: {
        email_verification_token: token,
        email_verification_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      const error = new Error('Invalid or expired email verification link.');
      error.statusCode = 400;
      throw error;
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();

    return { message: 'Email verified successfully! You can now access all features.' };
  }

  /**
   * 7. PHONE VERIFICATION - SEND OTP
   */
  async sendPhoneOtp(userId, phone) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + config.security.otpExpiryMinutes * 60 * 1000);

    user.phone = phone.trim();
    user.phone_otp = otp;
    user.phone_otp_expires = expiresAt;
    user.is_phone_verified = false;
    await user.save();

    // Send SMS
    await notificationService.sendPhoneOtp(phone, otp);

    return { message: `Verification OTP sent to ${phone}. Valid for ${config.security.otpExpiryMinutes} minutes.` };
  }

  /**
   * 8. PHONE VERIFICATION - VERIFY OTP
   */
  async verifyPhoneOtp(userId, otp) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!user.phone_otp || user.phone_otp !== otp.trim()) {
      const error = new Error('Incorrect verification OTP.');
      error.statusCode = 400;
      throw error;
    }

    if (new Date() > user.phone_otp_expires) {
      const error = new Error('OTP has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    user.is_phone_verified = true;
    user.phone_otp = null;
    user.phone_otp_expires = null;
    await user.save();

    return { message: 'Phone number verified successfully!' };
  }

  /**
   * 9. FORGOT PASSWORD (REQUEST RESET LINK)
   */
  async forgotPassword(email) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });

    // In production security: always return 200 even if email not found to prevent user enumeration attacks
    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + config.security.passwordResetExpiryHours * 60 * 60 * 1000);

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;
    await user.save();

    await notificationService.sendPasswordResetEmail(cleanEmail, resetToken);

    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  /**
   * 10. RESET PASSWORD (USING RESET TOKEN)
   */
  async resetPassword({ token, newPassword }) {
    if (!token || !newPassword) {
      const error = new Error('Reset token and new password are required.');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      const error = new Error('Password reset token is invalid or has expired.');
      error.statusCode = 400;
      throw error;
    }

    // Setting password_hash triggers the model beforeUpdate hook to re-hash with bcrypt
    user.password_hash = newPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Revoke all existing refresh tokens for security
    await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: user.id } });

    return { message: 'Password reset successful! Please log in with your new password.' };
  }

  /**
   * 11. CHANGE PASSWORD (AUTHENTICATED)
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      const error = new Error('Please provide both current and new password.');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.validatePassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Current password is incorrect.');
      error.statusCode = 401;
      throw error;
    }

    user.password_hash = newPassword;
    await user.save();

    return { message: 'Password changed successfully!' };
  }

  /**
   * 12. GET PROFILE
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user.toJSON();
  }
}

export default new AuthService();
