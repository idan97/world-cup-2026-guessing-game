import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export const requestLogging = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
    },
    'Incoming request'
  );
  next();
};
