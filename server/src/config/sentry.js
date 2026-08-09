import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

let enabled = false;

/** Call once at startup, before routes are registered. Safe no-op if SENTRY_DSN is unset. */
export function initErrorTracking(app) {
  if (!process.env.SENTRY_DSN) {
    logger.warn('[sentry] SENTRY_DSN not set — error tracking disabled. Errors will only go to logs.');
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
  enabled = true;
  logger.info('[sentry] error tracking enabled');
}

/** Registered AFTER routes, BEFORE the app's own error handler, so Sentry sees the error first. */
export function sentryErrorHandler() {
  if (!enabled) return (_err, _req, _res, next) => next(_err);
  return Sentry.expressErrorHandler();
}

export function captureException(err, context) {
  if (!enabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
