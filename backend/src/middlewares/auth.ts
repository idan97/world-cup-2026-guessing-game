import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require authenticated user
 * Returns 401 if user is not authenticated
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.auth?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  next();
};
