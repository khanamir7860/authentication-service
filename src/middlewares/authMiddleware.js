import tokenService from '../services/tokenService.js';

/**
 * ============================================================================
 * AUTHENTICATE ACCESS TOKEN MIDDLEWARE
 * ============================================================================
 * 
 * Verifies short-lived JWT Access Tokens sent in the Authorization header:
 * Authorization: Bearer <access_token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No bearer authorization token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded; // { id, username, email, isEmailVerified, isPhoneVerified }
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      error: err.message || 'Invalid or expired authorization token.',
    });
  }
}

export default authenticateToken;
