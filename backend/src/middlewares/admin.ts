import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin status',
    });
  }
};
