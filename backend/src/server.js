import 'dotenv/config';
import app from './app.js';
import { closePool } from './db.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[API] AI Productivity Coach server running on port ${PORT}`);
  console.log(`[API] Health check available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handler
let isShuttingDown = false;

async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[API] Received ${signal}. Starting graceful shutdown...`);

  // Force close after 5 seconds if connections fail to drain
  const forceExitTimeout = setTimeout(() => {
    console.error('[API] Forcefully shutting down due to timeout');
    process.exit(1);
  }, 5000);
  forceExitTimeout.unref();

  server.close(async (err) => {
    if (err) {
      console.error('[API] Error while closing HTTP server:', err.message);
    } else {
      console.log('[API] HTTP server closed');
    }

    await closePool();
    process.exit(0);
  });
}

// Attach process termination signals
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Uncaught exception and rejection handlers
process.on('uncaughtException', (err) => {
  console.error('[API] Uncaught Exception:', err);
  handleShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[API] Unhandled Promise Rejection:', reason);
  handleShutdown('unhandledRejection');
});
