import fs from 'node:fs';
import pg from 'pg';

// Return NUMERIC and BIGINT as numbers and DATE as 'YYYY-MM-DD' (no timezone shift).
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

export function sslOptions(config) {
  if (config.DATABASE_SSL === 'disable') return false;
  if (config.DATABASE_SSL === 'verify') {
    const ca = config.DATABASE_SSL_CA_PATH ? fs.readFileSync(config.DATABASE_SSL_CA_PATH, 'utf8') : undefined;
    return { rejectUnauthorized: true, ca };
  }
  return { rejectUnauthorized: false };
}

// Database handle used by every service: query() for single statements,
// transaction() for multi-step writes that must succeed or fail together.
export function createPgDatabase(config, logger) {
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    ssl: sslOptions(config),
    max: config.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: 'advisory-crm-api',
  });

  pool.on('error', (err) => logger.error({ err }, 'Idle database client error'));

  return {
    query: (text, params) => pool.query(text, params),

    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const result = await fn({ query: (text, params) => client.query(text, params) });
        await client.query('commit');
        return result;
      } catch (err) {
        await client.query('rollback').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    close: () => pool.end(),
  };
}
