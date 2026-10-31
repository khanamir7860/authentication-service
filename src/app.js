import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

/**
 * ============================================================================
 * EXPRESS APPLICATION SETUP (PRODUCTION SEPARATION)
 * ============================================================================
 * 
 * Separating `app` from `server.listen()` is an essential production pattern:
 * - Enables automated integration testing without starting network listeners.
 * - Centralizes middleware and route mounting.
 */

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. API Routes
app.use('/api', routes);

// 4. Centralized Error Handling Middleware (must be after all routes)
app.use(errorHandler);

export default app;

