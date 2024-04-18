import mongoose from 'mongoose';
import cors from 'cors'; // Import cors middleware
import { createServer } from 'http'; // Import createServer function from 'http'
import { Server } from 'socket.io';
import redisAdapter from 'socket.io-redis';
import config from 'config/config';
import { logger } from 'config/logger';
import socketAPI from 'appEvents/socketAPI';
import { initSockets } from 'appEvents/handler';
import app from './app';

const server = createServer(app); // Create HTTP server using Express app
// const io = new Server(server); // Create Socket.IO server

// Use cors middleware
app.use(
  cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST'], // Allow these HTTP methods
    allowedHeaders: ['Access-Control-Allow-Origin', 'http://localhost:3000'], // Allow these headers
  })
);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`Listening to port ${config.port}`);
  });
  mongoose.set('useFindAndModify', false);

  // Configure Socket.IO with Redis adapter and attach it to the HTTP server
  const io = new Server(server); // Create Socket.IO server
  io.adapter(redisAdapter({ host: config.redis.host, port: config.redis.port })); // Configure Socket.IO with Redis adapter
  socketAPI.io = io; // Set the io instance in socketAPI
  socketAPI.io.attach(server); // Attach Socket.IO to the HTTP server

  initSockets();
});

const exitHandler = () => {
  logger.info('Server closed');
  process.exit(1);
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  server.close();
});

// import mongoose from 'mongoose';
// // TODO: implement in the future
// import config from 'config/config';
// import { logger } from 'config/logger';
// import socketAPI from 'appEvents/socketAPI';
// import redisAdapter from 'socket.io-redis';
// import app from './app';
//
// const { initSockets } = require('appEvents/handler');
//
// let server;
// mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
//   logger.info('Connected to MongoDB');
//   server = app.listen(config.port, '0.0.0.0', () => {
//     logger.info(`Listening to port ${config.port}`);
//   });
//   mongoose.set('useFindAndModify', false);
//   // check whether Socket is enabled or not TODO: implement in the future
//   socketAPI.io.adapter(redisAdapter({ host: config.redis.host, port: config.redis.port }));
//   socketAPI.io.attach(server, {
//     cors: {
//       origin: 'http://localhost:3000',
//       methods: ['GET', 'POST'],
//     },
//   });
//   // socketAPI.set('origins', '*:*');
//   initSockets();
// });
//
// const exitHandler = () => {
//   if (server) {
//     server.close(() => {
//       logger.info('Server closed');
//       process.exit(1);
//     });
//   } else {
//     process.exit(1);
//   }
// };
// const unexpectedErrorHandler = (error) => {
//   logger.error(error);
//   exitHandler();
// };
// process.on('uncaughtException', unexpectedErrorHandler);
// process.on('unhandledRejection', unexpectedErrorHandler);
// process.on('SIGTERM', () => {
//   logger.info('SIGTERM received');
//   if (server) {
//     server.close();
//   }
// });
