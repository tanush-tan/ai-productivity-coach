import express from 'express';
import cors from 'cors';
import { checkDbHealth } from './db.js';
import authRouter from './routes/auth.js';
import pairingRouter from './routes/pairing.js';
import devicesRouter from './routes/devices.js';
import sessionsRouter from './routes/sessions.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/pairing', pairingRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/sessions', sessionsRouter);

/**
 * Health check endpoint: verifies both API process and PostgreSQL database connectivity.
 * - HTTP 200 if both API and DB are healthy.
 * - HTTP 503 if API is up but DB connection fails or DATABASE_URL is missing/unreachable.
 */
app.get('/api/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  try {
    const dbHealth = await checkDbHealth();

    return res.status(200).json({
      status: 'healthy',
      timestamp,
      api: {
        status: 'up',
        uptimeSeconds,
      },
      database: {
        status: 'connected',
        latencyMs: dbHealth.latencyMs,
        serverTime: dbHealth.now,
      },
    });
  } catch (err) {
    const dbErrorMessage =
      err.message ||
      (Array.isArray(err.errors) && err.errors.map((e) => e.message).join('; ')) ||
      err.code ||
      'Database connection failed';

    return res.status(503).json({
      status: 'degraded',
      timestamp,
      api: {
        status: 'up',
        uptimeSeconds,
      },
      database: {
        status: 'disconnected',
        error: dbErrorMessage,
      },
    });
  }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

export default app;
