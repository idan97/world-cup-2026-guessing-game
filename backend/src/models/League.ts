import prisma from '../db';
import { randomBytes } from 'crypto';
import type { League, LeagueAllowEmail } from '../types';

export class LeagueModel {
  static async findById(id: string): Promise<League | null> {
    return await prisma.league.findUnique({
      where: { id },
    });
  }

  static async ensureGeneralLeagueExists(): Promise<League> {
    return await prisma.league.upsert({
      where: { id: 'general' },
      update: {},
      create: {
        id: 'general',
        name: 'General',
        description: 'Public league for all players.',
        joinCode: randomBytes(4).toString('hex'), // 8-char random code
      },
    });
  }

  static async addMember(
    leagueId: string,
    userId: string,
    role: 'ADMIN' | 'PLAYER'
  ): Promise<void> {
    await prisma.leagueMember.create({
      data: {
        leagueId,
        userId,
        role,
      },
    });
  }

  static async getAllowListByEmail(email: string): Promise<LeagueAllowEmail[]> {
    return await prisma.leagueAllowEmail.findMany({
      where: { email },
    });
  }

  static async removeFromAllowList(
    leagueId: string,
    email: string
  ): Promise<void> {
    await prisma.leagueAllowEmail.delete({
      where: {
        leagueId_email: {
          leagueId,
          email,
        },
      },
    });
  }
}
