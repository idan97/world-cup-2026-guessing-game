import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(
    { err, req: { method: req.method, url: req.url } },
    'Unhandled error',
  );
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
  });
};
