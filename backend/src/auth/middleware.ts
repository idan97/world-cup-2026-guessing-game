import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from './jwt';
import logger from '../logger';

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyJWT(token);

    req.user = payload;
    next();
  } catch (error) {
    logger.warn({ error }, 'Authentication failed');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

export const requireApproved = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (!req.user.isApproved) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Account not approved. Please wait for admin approval.',
    });
    return;
  }

  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return;
  }

  next();
};

// Optional auth - adds user to request if token is present but doesn't require it
export const optionalAuth = (
  req: Request,
  ___res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyJWT(token);
      req.user = payload;
    }

    next();
  } catch {
    // Just continue without user info if token is invalid
    next();
  }
};
