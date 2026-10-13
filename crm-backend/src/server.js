import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { connectMongo } from './db/mongo.js';
import { createLogger } from './logger.js';
import { createMongoAuth } from './services/auth.service.js';

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const logger = createLogger(config.LOG_LEVEL);

let db;
try {
  db = await connectMongo(config.MONGODB_URI, logger);
} catch (err) {
  logger.fatal({ err }, 'Failed to connect to MongoDB. Check MONGODB_URI in your .env file.');
  process.exit(1);
}

const auth = createMongoAuth(config);
const app = createApp({ config, db, auth, logger });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Advisory CRM API listening on port ' + config.PORT);
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down server');
  const force = setTimeout(() => {
    logger.error('Forced shutdown after 10s');
    process.exit(1);
  }, 10_000);
  force.unref();
  server.close(async () => {
    await db.close().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled promise rejection'));
