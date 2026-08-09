import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { httpLogger } from './config/logger.js';
import { initErrorTracking, sentryErrorHandler } from './config/sentry.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { razorpayWebhook } from './controllers/billingController.js';

import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import talentPoolRoutes from './routes/talentPoolRoutes.js';
import companyRoutes from './routes/companyRoutes.js';

export function createApp() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const app = express();

  initErrorTracking(app);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  if (process.env.NODE_ENV !== 'test') app.use(httpLogger);
  app.use(globalLimiter);

  // Razorpay webhook needs the raw body for HMAC signature verification —
  // must be registered BEFORE express.json() touches the request stream.
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'hireloop-api' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/auth', oauthRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/candidate', candidateRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/talent-pool', talentPoolRoutes);
  app.use('/api/companies', companyRoutes);

  app.use(notFound);
  app.use(sentryErrorHandler());
  app.use(errorHandler);

  return app;
}
