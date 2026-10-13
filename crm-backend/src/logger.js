import pino from 'pino';

export function createLogger(level = process.env.LOG_LEVEL || 'info') {
  return pino({
    level,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-webhook-secret"]', 'password', 'refreshToken'],
      censor: '[redacted]',
    },
  });
}
