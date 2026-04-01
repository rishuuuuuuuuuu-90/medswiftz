import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocket } from './socket';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 MediSwiftzzz API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});
