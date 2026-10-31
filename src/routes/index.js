import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

/**
 * Mount sub-routers
 */
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    orm: 'sequelize',
    timestamp: new Date().toISOString(),
  });
});

export default router;

