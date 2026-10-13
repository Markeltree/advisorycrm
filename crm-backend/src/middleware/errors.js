import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';

// Postgres error codes that are the caller's fault rather than a server bug.
const PG_ERRORS = {
  '22P02': [400, 'A value has the wrong format.'],
  '22007': [400, 'A date has the wrong format.'],
  '22008': [400, 'A date is out of range.'],
  '23502': [400, 'A required value is missing.'],
  '23503': [400, 'A linked record does not exist.'],
  '23505': [409, 'This record already exists.'],
  '23514': [400, 'A value is not allowed.'],
  '40001': [503, 'The server was busy. Try again.'],
  '40P01': [503, 'The server was busy. Try again.'],
};

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}.` });
}

// Every error leaves as { message } (plus field `errors` for validation), the shape the frontend reads.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const errors = {};
    for (const issue of err.issues) errors[issue.path.join('.') || '_'] ??= issue.message;
    const messages = Object.values(errors);
    return res.status(400).json({
      message: messages.length === 1 ? messages[0] : `${messages.length} fields need attention. ${messages.join(' ')}`,
      errors,
    });
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) req.log?.error({ err }, err.message);
    return res.status(err.status).json({ message: err.message, ...err.extra });
  }

  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body is not valid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'The request body is too large.' });

  if (err?.code && PG_ERRORS[err.code]) {
    const [status, message] = PG_ERRORS[err.code];
    req.log?.warn({ err }, 'Database rejected the request');
    return res.status(status).json({ message });
  }

  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Something went wrong on the server. Try again.' });
}
