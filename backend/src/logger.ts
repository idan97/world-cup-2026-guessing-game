import pino from 'pino';
import { config } from './config';

const logger = config.isDevelopment
  ? pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    })
  : pino({
      level: 'info',
    });

export default logger;
