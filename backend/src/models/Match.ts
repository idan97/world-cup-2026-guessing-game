import prisma from '../db';
import type { Stage } from '../types';
import type { Prisma } from '@prisma/client';

// Define Match type with relations based on what we actually fetch from Prisma  
export type MatchWithRelations = Prisma.MatchGetPayload<{
  include: { team1: true; team2: true; winner: true }
}>;

interface MatchFilters {
  stage?: Stage;
  groupLetter?: string;
  upcoming?: boolean;
  limit?: number;
}

export class MatchModel {
  // Get all matches with optional stage filter
  static async findAll(stage?: Stage): Promise<MatchWithRelations[]> {
    return await prisma.match.findMany({
      ...(stage ? { where: { stage } } : {}),
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });
  }

  // Get matches with flexible filters
  static async findWithFilters(filters: MatchFilters): Promise<MatchWithRelations[]> {
    const { stage, groupLetter, upcoming, limit } = filters;

    // Build where clause
    const where: Prisma.MatchWhereInput = {};

    if (stage) {
      where.stage = stage;
    }

    if (groupLetter) {
      // Filter by group - matches where team1 or team2 belong to this group
      where.OR = [
        { team1: { groupLetter } },
        { team2: { groupLetter } },
      ];
    }

    if (upcoming) {
      where.scheduledAt = {
        gte: new Date(),
      };
      where.isFinished = false;
    }

    return await prisma.match.findMany({
      where,
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
      ...(limit ? { take: limit } : {}),
    });
  }

  // Get single match by ID
  static async findById(id: string): Promise<MatchWithRelations | null> {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  }

  // Get upcoming matches
  static async findUpcoming(limit: number = 10): Promise<MatchWithRelations[]> {
    const now = new Date();
    return await prisma.match.findMany({
      where: {
        scheduledAt: {
          gte: now,
        },
        isFinished: false,
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: limit,
    });
  }

  // Get matches by stage
  static async findByStage(stage: Stage): Promise<MatchWithRelations[]> {
    return await prisma.match.findMany({
      where: { stage },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
    });
  }

  // Create a new match
  static async create(matchData: {
    stage: Stage;
    team1Code: string;
    team2Code: string;
    team1Name?: string;
    team2Name?: string;
    scheduledAt: Date;
    matchNumber: number;
    team1Id?: string | null;
    team2Id?: string | null;
    venue?: string;
    venueCode?: number;
  }): Promise<MatchWithRelations> {
    return await prisma.match.create({
      data: matchData,
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  }

  // Update match details
  static async update(
    id: string,
    data: Partial<{
      stage: Stage;
      team1Code: string;
      team2Code: string;
      scheduledAt: Date;
      team1Id: string | null;
      team2Id: string | null;
      team1Score: number | null;
      team2Score: number | null;
      winnerId: string | null;
      isFinished: boolean;
    }>
  ): Promise<MatchWithRelations> {
    return await prisma.match.update({
      where: { id },
      data,
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  }

  // Update match result
  static async updateResult(
    id: string,
    team1Score: number,
    team2Score: number,
    winnerId: string | null
  ): Promise<MatchWithRelations> {
    return await prisma.match.update({
      where: { id },
      data: {
        team1Score,
        team2Score,
        winnerId,
        isFinished: true,
        playedAt: new Date(),
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  }

  // Bulk create matches
  static async createMany(
    matches: Array<{
      stage: Stage;
      team1Code: string;
      team2Code: string;
      team1Name?: string;
      team2Name?: string;
      scheduledAt: Date;
      matchNumber: number;
      team1Id?: string | null;
      team2Id?: string | null;
      venue?: string;
      venueCode?: number;
    }>
  ): Promise<void> {
    await prisma.match.createMany({
      data: matches,
      skipDuplicates: true,
    });
  }

  // Find matches by IDs (for validation)
  static async findByIds(ids: string[]): Promise<MatchWithRelations[]> {
    return await prisma.match.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
    });
  }
}
