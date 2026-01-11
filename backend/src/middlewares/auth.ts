import { Request, Response, NextFunction } from 'express';

// Type guard to ensure userId exists after requireAuth
export interface AuthenticatedRequest extends Request {
  auth: Request['auth'] & {
    userId: string; // Non-null after requireAuth
  };
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.auth?.userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  next();
};
