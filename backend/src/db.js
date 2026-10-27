import pg from 'pg';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Configure connection pool
export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: connectionString && connectionString.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

// Catch errors on idle clients to prevent crashing the server
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Health check query to verify database connectivity.
 * Executes a simple lightweight query and returns latency.
 */
export async function checkDbHealth() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured in environment variables');
  }

  const start = Date.now();
  const result = await pool.query('SELECT 1 AS ok, NOW() AS now;');
  const latencyMs = Date.now() - start;

  return {
    ok: result.rows[0].ok === 1,
    now: result.rows[0].now,
    latencyMs,
  };
}

/**
 * Gracefully close database pool connections on shutdown.
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('[DB] PostgreSQL pool closed successfully');
  } catch (err) {
    console.error('[DB] Error while closing PostgreSQL pool:', err.message);
  }
}
