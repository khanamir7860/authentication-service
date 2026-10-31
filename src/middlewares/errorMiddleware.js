import { ValidationError, UniqueConstraintError } from 'sequelize';

/**
 * ============================================================================
 * CENTRALIZED ERROR HANDLING MIDDLEWARE
 * ============================================================================
 * 
 * Captures all errors thrown in services and controllers, ensuring the client
 * always receives predictable, cleanly formatted error responses.
 */
export function errorHandler(err, req, res, next) {
  console.error(`💥 [Error]: ${err.name} - ${err.message}`);

  // Handle Sequelize validation errors (e.g. invalid email format)
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages[0] || 'Validation error',
      details: messages,
    });
  }

  // Handle Sequelize unique constraint violations
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      error: err.errors[0]?.message || 'Resource already exists.',
    });
  }

  // Handle custom application errors with assigned status codes
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export default errorHandler;

