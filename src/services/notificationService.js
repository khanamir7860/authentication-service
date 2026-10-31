import config from '../config/index.js';

/**
 * ============================================================================
 * NOTIFICATION SERVICE (EMAIL & SMS OTP DISPATCHER)
 * ============================================================================
 * 
 * In development, this service formats and logs verification links and OTPs
 * directly to the server terminal with clear instructions.
 * In production, hook your Nodemailer, SendGrid, or Twilio clients here.
 */
class NotificationService {
  /**
   * Send Email Verification Link
   */
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;

    console.log(`\n================== [EMAIL DISPATCHER] ==================`);
    console.log(`📨 To: ${email}`);
    console.log(`📌 Subject: Please verify your email address`);
    console.log(`🔗 Verification Link: ${verificationUrl}`);
    console.log(`🕒 Valid for ${config.security.emailVerificationExpiryHours} hours`);
    console.log(`========================================================\n`);

    return true;
  }

  /**
   * Send Password Reset Link
   */
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

    console.log(`\n================== [EMAIL DISPATCHER] ==================`);
    console.log(`📨 To: ${email}`);
    console.log(`🔑 Subject: Password Reset Request`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log(`🕒 Valid for ${config.security.passwordResetExpiryHours} hour`);
    console.log(`========================================================\n`);

    return true;
  }

  /**
   * Send Phone SMS OTP
   */
  async sendPhoneOtp(phone, otp) {
    console.log(`\n================== [SMS DISPATCHER] ====================`);
    console.log(`📱 To Phone: ${phone}`);
    console.log(`🔢 Your Verification OTP is: [ ${otp} ]`);
    console.log(`🕒 Valid for ${config.security.otpExpiryMinutes} minutes`);
    console.log(`========================================================\n`);

    return true;
  }
}

export default new NotificationService();

