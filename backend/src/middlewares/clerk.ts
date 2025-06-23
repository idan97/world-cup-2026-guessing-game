import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';
import logger from '../logger';
import { config } from '../config';
import { UserService } from '../services/UserService';

// Initialize Clerk middleware
export const clerk = clerkMiddleware({
  secretKey: config.clerkSecretKey,
});

// DB sync middleware - runs after Clerk auth to sync user data
export const syncUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, sessionClaims } = req.auth;

    // Get user data from Clerk
    const email = sessionClaims.email_address;
    const name = sessionClaims.name || 'Unknown User';

    const { isNewUser } = await UserService.syncUserFromClerk(
      userId,
      email,
      name
    );

    if (isNewUser) {
      await UserService.provisionNewUser(userId, email);
    }

    next();
  } catch (error) {
    logger.error(
      { error, userId: req.auth?.userId },
      'Error in user sync middleware'
    );
    next(error);
  }
};
