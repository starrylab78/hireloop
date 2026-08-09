import pino from 'pino';
import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined // production: plain JSON to stdout, for log aggregators (Datadog, CloudWatch, etc.)
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  redact: {
    // Never let secrets/PII leak into logs even if someone logs `req` or `body` wholesale.
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.email',
      '*.razorpayKeySecret',
      '*.passwordHash',
    ],
    remove: true,
  },
});

/** Express middleware: structured request/response logging with a correlation id on every request. */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
