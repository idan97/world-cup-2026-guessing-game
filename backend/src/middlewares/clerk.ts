import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';
import logger from '../logger';
import { config } from '../config';
import { UserModel } from '../models/User';
import { LeagueModel } from '../models/League';
import { LeagueRole } from '@prisma/client';

// Initialize Clerk middleware
// Log Clerk config on startup (one-time)
if (config.clerkSecretKey) {
  console.log(
    '[Clerk] Secret key loaded:',
    config.clerkSecretKey.substring(0, 15) + '...'
  );
} else {
  console.error('[Clerk] WARNING: No CLERK_SECRET_KEY configured!');
}

export const clerk = clerkMiddleware({
  secretKey: config.clerkSecretKey,
  publishableKey: config.clerkPublishableKey,
});

// DB sync middleware - runs after Clerk auth to sync user data
export const syncUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, sessionClaims } = req.auth;

    // Skip sync if user is not authenticated
    if (!userId || !sessionClaims) {
      next();
      return;
    }

    // Get user data from Clerk (email can be in different places depending on Clerk config)
    interface ClerkClaims {
      email?: string;
      email_address?: string;
      primary_email_address?: string;
      name?: string;
      full_name?: string;
    }
    const claims = sessionClaims as ClerkClaims;
    const email =
      claims.email ||
      claims.email_address ||
      claims.primary_email_address ||
      `${userId}@clerk.local`; // Fallback for users without email
    const name = claims.name || claims.full_name || 'Unknown User';

    // Sync user from Clerk
    const { isNewUser } = await syncUserFromClerk(
      userId,
      email as string,
      name as string
    );

    if (isNewUser) {
      await provisionNewUser(userId, email);
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

// Business logic functions (moved from UserModel)
async function syncUserFromClerk(
  userId: string,
  email: string,
  displayName: string
): Promise<{ isNewUser: boolean }> {
  try {
    const existingUser = await UserModel.findByIdWithGeneralLeague(userId);

    // Only sync if user doesn't exist or data changed
    if (!existingUser) {
      await UserModel.create(userId, email, displayName);
      logger.info({ userId, email, isNewUser: true }, 'New user created');
    } else if (
      existingUser.email !== email ||
      existingUser.displayName !== displayName
    ) {
      await UserModel.update(userId, email, displayName);
      logger.info({ userId, email, isNewUser: false }, 'User updated');
    }

    return { isNewUser: !existingUser };
  } catch (error) {
    logger.error({ error, userId }, 'Error syncing user from Clerk');
    throw error;
  }
}

async function provisionNewUser(userId: string, email: string): Promise<void> {
  try {
    const generalLeague = await LeagueModel.ensureGeneralLeagueExists();
    await LeagueModel.addMember(generalLeague.id, userId, LeagueRole.PLAYER);

    const allowList = await LeagueModel.getAllowListByEmail(email);

    for (const row of allowList) {
      await LeagueModel.addMember(row.leagueId, userId, row.role);
      await LeagueModel.removeFromAllowList(row.leagueId, email);

      logger.info(
        { userId, leagueId: row.leagueId, role: row.role },
        'User added to pre-approved league'
      );
    }

    logger.info({ userId, email }, 'New user fully provisioned');
  } catch (error) {
    logger.error({ error, userId }, 'Error provisioning new user');
    throw error;
  }
}
