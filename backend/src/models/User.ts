import prisma from '../db';

export class UserModel {
  // Find user with general league membership
  static async findByIdWithGeneralLeague(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leagues: {
          where: { leagueId: 'general' },
        },
      },
    });
  }

  // Update existing user
  static async updateUser(userId: string, email: string, displayName: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { email, displayName },
    });
  }

  // Create new user (using $executeRaw to bypass Prisma type issues)
  static async createUser(userId: string, email: string, displayName: string) {
    return await prisma.$executeRaw`
      INSERT INTO users (id, email, "displayName", "createdAt", "updatedAt")
      VALUES (${userId}, ${email}, ${displayName}, NOW(), NOW())
    `;
  }
}
