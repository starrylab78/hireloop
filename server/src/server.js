import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => logger.info(`HireLoop API listening on port ${PORT}`));
  })
  .catch((err) => {
    logger.error({ err }, 'failed to start server');
    process.exit(1);
  });

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server?.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
