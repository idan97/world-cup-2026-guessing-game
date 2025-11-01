import prisma from '../db';
import type { Match, Stage } from '../types';

export class MatchModel {
  // Get all matches with optional stage filter
  static async findAll(stage?: Stage): Promise<Match[]> {
    return await prisma.match.findMany({
      ...(stage ? { where: { stage } } : {}),
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
      orderBy: [{ kickoff: 'asc' }, { id: 'asc' }],
    });
  }

  // Get single match by ID
  static async findById(id: number): Promise<Match | null> {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
    });
  }

  // Get upcoming matches
  static async findUpcoming(limit: number = 10): Promise<Match[]> {
    const now = new Date();
    return await prisma.match.findMany({
      where: {
        kickoff: {
          gte: now,
        },
      },
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
      orderBy: {
        kickoff: 'asc',
      },
      take: limit,
    });
  }

  // Get matches by stage
  static async findByStage(stage: Stage): Promise<Match[]> {
    return await prisma.match.findMany({
      where: { stage },
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
      orderBy: [{ kickoff: 'asc' }, { id: 'asc' }],
    });
  }

  // Create a new match
  static async create(matchData: {
    id: number;
    stage: Stage;
    slot: string;
    kickoff: Date;
    teamAId?: string | null;
    teamBId?: string | null;
  }): Promise<Match> {
    return await prisma.match.create({
      data: matchData,
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
    });
  }

  // Update match details
  static async update(
    id: number,
    data: Partial<{
      stage: Stage;
      slot: string;
      kickoff: Date;
      teamAId: string | null;
      teamBId: string | null;
      scoreA: number | null;
      scoreB: number | null;
      winnerTeamId: string | null;
    }>
  ): Promise<Match> {
    return await prisma.match.update({
      where: { id },
      data,
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
    });
  }

  // Update match result
  static async updateResult(
    id: number,
    scoreA: number,
    scoreB: number,
    winnerTeamId: string | null
  ): Promise<Match> {
    return await prisma.match.update({
      where: { id },
      data: {
        scoreA,
        scoreB,
        winnerTeamId,
      },
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
      },
    });
  }

  // Bulk create matches
  static async createMany(
    matches: Array<{
      id: number;
      stage: Stage;
      slot: string;
      kickoff: Date;
      teamAId?: string | null;
      teamBId?: string | null;
    }>
  ): Promise<void> {
    await prisma.match.createMany({
      data: matches,
      skipDuplicates: true,
    });
  }
}
