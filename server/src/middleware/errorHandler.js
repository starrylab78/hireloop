import { logger } from '../config/logger.js';
import { captureException } from '../config/sentry.js';

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  const log = req.log || logger; // pino-http attaches a per-request child logger with the request id
  if (status >= 500) {
    log.error({ err, path: req.originalUrl }, 'unhandled server error');
    captureException(err, { path: req.originalUrl, userId: req.user?._id?.toString() });
  } else {
    log.warn({ code: err.code, path: req.originalUrl }, err.message);
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists', code: 'DUPLICATE_KEY' });
  }

  res.status(status).json({
    error: err.publicMessage || (status === 500 ? 'Internal server error' : err.message),
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.id,
  });
}
