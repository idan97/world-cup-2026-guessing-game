import { UserModel } from '../models/User';
import { LeagueModel } from '../models/League';
import logger from '../logger';

export class UserService {
  static async syncUserFromClerk(
    userId: string,
    email: string,
    displayName: string
  ): Promise<{ isNewUser: boolean }> {
    try {
      // Use UserModel for all user database operations
      const existingUser = await UserModel.findByIdWithGeneralLeague(userId);

      // Only sync if user doesn't exist or data changed
      if (!existingUser) {
        // Create new user using UserModel
        await UserModel.createUser(userId, email, displayName);
        logger.info({ userId, email, isNewUser: true }, 'New user created');
      } else if (
        existingUser.email !== email ||
        existingUser.displayName !== displayName
      ) {
        // Update existing user using UserModel
        await UserModel.updateUser(userId, email, displayName);
        logger.info({ userId, email, isNewUser: false }, 'User updated');
      }

      return { isNewUser: !existingUser };
    } catch (error) {
      logger.error({ error, userId }, 'Error syncing user from Clerk');
      throw error;
    }
  }

  static async provisionNewUser(userId: string, email: string): Promise<void> {
    try {
      const generalLeague = await LeagueModel.ensureGeneralLeagueExists();
      await LeagueModel.addMember(generalLeague.id, userId, 'PLAYER');

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
}
