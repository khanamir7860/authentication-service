import dotenv from 'dotenv';

dotenv.config();

/**
 * ============================================================================
 * CENTRALIZED AUTHENTICATION CONFIGURATION
 * ============================================================================
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwt: {
    // Access Token: Short-lived (15 minutes) for security
    accessSecret: process.env.JWT_SECRET || 'supersecret_jwt_chat_key_2026_change_in_production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

    // Refresh Token: Long-lived (7 days) for seamless re-authentication
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_jwt_key_2026_change_in_production',
    refreshExpiresInDays: 7,
  },

  security: {
    saltRounds: 10,
    otpExpiryMinutes: 10,         // Phone OTP valid for 10 minutes
    passwordResetExpiryHours: 1,  // Password reset token valid for 1 hour
    emailVerificationExpiryHours: 24, // Email verification valid for 24 hours
  },
};

export default config;

