import prisma from '../db';
import { randomBytes } from 'crypto';
import type {
  League,
  LeagueAllowEmail,
  LeagueMember,
  LeagueMessage,
  LeagueRole,
} from '../types';

export class LeagueModel {
  // Basic CRUD operations
  static async findById(id: string): Promise<League | null> {
    return await prisma.league.findUnique({
      where: { id },
    });
  }

  static async findByJoinCode(joinCode: string): Promise<League | null> {
    return await prisma.league.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
    });
  }

  static async create(
    name: string,
    description: string | null,
    joinCode: string
  ): Promise<League> {
    return await prisma.league.create({
      data: {
        name,
        description,
        joinCode,
      },
    });
  }

  static async update(id: string, data: Partial<League>): Promise<League> {
    return await prisma.league.update({
      where: { id },
      data,
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
        joinCode: randomBytes(4).toString('hex').toUpperCase(),
      },
    });
  }

  // League membership operations
  static async getUserLeagues(userId: string): Promise<
    Array<
      LeagueMember & {
        league: {
          name: string;
          description: string | null;
          joinCode: string;
          createdAt: Date;
          _count: { members: number };
        };
      }
    >
  > {
    return await prisma.leagueMember.findMany({
      where: { userId },
      include: {
        league: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });
  }

  static async getUserMembership(
    leagueId: string,
    userId: string
  ): Promise<LeagueMember | null> {
    return await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });
  }

  static async addMember(
    leagueId: string,
    userId: string,
    role: LeagueRole
  ): Promise<void> {
    await prisma.leagueMember.create({
      data: {
        leagueId,
        userId,
        role,
      },
    });
  }

  static async removeMember(leagueId: string, userId: string): Promise<void> {
    await prisma.leagueMember.delete({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });
  }

  static async isMember(leagueId: string, userId: string): Promise<boolean> {
    const member = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });
    return !!member;
  }

  static async getLeagueMembers(
    leagueId: string
  ): Promise<
    Array<LeagueMember & { user: { displayName: string; email: string } }>
  > {
    return await prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: {
          select: { displayName: true, email: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // League messages operations
  static async getLeagueMessages(leagueId: string): Promise<LeagueMessage[]> {
    return await prisma.leagueMessage.findMany({
      where: { leagueId },
      include: {
        author: {
          select: { displayName: true },
        },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async createLeagueMessage(
    leagueId: string,
    authorId: string,
    title: string,
    body: string,
    pinned: boolean = false
  ): Promise<LeagueMessage> {
    return await prisma.leagueMessage.create({
      data: {
        leagueId,
        authorId,
        title,
        body,
        pinned,
      },
      include: {
        author: {
          select: { displayName: true },
        },
      },
    });
  }

  // Allow list operations
  static async getAllowListByEmail(email: string): Promise<LeagueAllowEmail[]> {
    return await prisma.leagueAllowEmail.findMany({
      where: { email },
    });
  }

  static async addToAllowList(
    leagueId: string,
    email: string,
    role: LeagueRole
  ): Promise<void> {
    await prisma.leagueAllowEmail.upsert({
      where: {
        leagueId_email: {
          leagueId,
          email,
        },
      },
      update: { role },
      create: {
        leagueId,
        email,
        role,
      },
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

  // Utility methods
  static generateJoinCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
