import mongoose from 'mongoose';
// TODO: implement in the future
import config from 'config/config';
import { logger } from 'config/logger';
import socketAPI from 'appEvents/socketAPI';
import redisAdapter from 'socket.io-redis';
import app from './app';

const { initSockets } = require('appEvents/handler');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Listening to port ${config.port}`);
  });
  mongoose.set('useFindAndModify', false);
  // check whether Socket is enabled or not TODO: implement in the future
  socketAPI.io.adapter(redisAdapter({ host: config.redis.host, port: config.redis.port }));
  socketAPI.io.attach(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://happymilan.tech/', 'https://happymilanweb.web.app/'],
      methods: ['GET', 'POST'],
    },
  });
  // socketAPI.set('origins', '*:*');
  initSockets();
});
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};
const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
