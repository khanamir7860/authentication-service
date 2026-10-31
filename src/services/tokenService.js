import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import RefreshToken from '../models/RefreshToken.js';

/**
 * ============================================================================
 * TOKEN SERVICE (ACCESS & REFRESH TOKEN MANAGEMENT)
 * ============================================================================
 */
class TokenService {
  /**
   * 1. Generate Short-Lived Access Token (JWT)
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.is_email_verified,
        isPhoneVerified: user.is_phone_verified,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  /**
   * 2. Generate Long-Lived Refresh Token & Save to Database
   */
  async generateRefreshToken(user) {
    // Generate secure random string
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    // Save token in PostgreSQL refresh_tokens table
    const refreshTokenRecord = await RefreshToken.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    return refreshTokenRecord.token;
  }

  /**
   * 3. Verify JWT Access Token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      const error = new Error(err.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Invalid access token.');
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * 4. Invalidate / Revoke a Refresh Token (Logout)
   */
  async revokeRefreshToken(token) {
    const record = await RefreshToken.findOne({ where: { token } });
    if (record) {
      record.revoked_at = new Date();
      await record.save();
    }
    return true;
  }

  /**
   * 5. Verify & Rotate Refresh Token
   */
  async verifyAndRotateRefreshToken(token, user) {
    const tokenRecord = await RefreshToken.findOne({ where: { token } });

    if (!tokenRecord || !tokenRecord.isActive) {
      const error = new Error('Invalid, expired, or revoked refresh token.');
      error.statusCode = 401;
      throw error;
    }

    // Revoke current token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + config.jwt.refreshExpiresInDays);

    tokenRecord.revoked_at = new Date();
    tokenRecord.replaced_by_token = newRefreshToken;
    await tokenRecord.save();

    // Issue new refresh token record
    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: newExpiresAt,
    });

    return newRefreshToken;
  }
}

export default new TokenService();

