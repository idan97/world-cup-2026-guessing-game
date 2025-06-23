import { User } from '@prisma/client';
import prisma from '../db';

export class UserModel {
  static async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  static async findByIdWithGeneralLeague(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leagues: {
          where: { leagueId: 'general' },
        },
      },
    });
  }

  static async create(
    userId: string,
    email: string,
    displayName: string
  ): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO users (id, email, "displayName", "createdAt", "updatedAt")
      VALUES (${userId}, ${email}, ${displayName}, NOW(), NOW())
    `;
  }

  static async update(
    userId: string,
    email: string,
    displayName: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { email, displayName },
    });
  }
}
