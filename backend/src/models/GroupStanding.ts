import prisma from '../db';
import type { GroupStanding, Prisma } from '@prisma/client';

type GroupStandingWithTeam = Prisma.GroupStandingGetPayload<{
  include: { team: true };
}>;

export class GroupStandingModel {
  /**
   * Get all group standings, optionally filtered by group letters
   * @param groupLetters - Array of group letters (e.g., ['A', 'B']) or undefined for all
   */
  static async findByGroups(
    groupLetters?: string[]
  ): Promise<GroupStandingWithTeam[]> {
    const where: Prisma.GroupStandingWhereInput = groupLetters
      ? { groupLetter: { in: groupLetters } }
      : {};

    return await prisma.groupStanding.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: [
        { groupLetter: 'asc' },
        { points: 'desc' },
        { goalDiff: 'desc' },
        { goalsFor: 'desc' },
      ],
    });
  }

  /**
   * Get standings for a single group
   * @param groupLetter - Single group letter (A-L)
   */
  static async findByGroup(groupLetter: string): Promise<GroupStanding[]> {
    return await prisma.groupStanding.findMany({
      where: { groupLetter },
      include: {
        team: true,
      },
      orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
    });
  }

  /**
   * Get all groups with their standings (A-L)
   * Returns an object with group letters as keys
   */
  static async getAllGroupsWithStandings(): Promise<
    Record<string, GroupStanding[]>
  > {
    const allStandings = await prisma.groupStanding.findMany({
      include: {
        team: true,
      },
      orderBy: [
        { groupLetter: 'asc' },
        { points: 'desc' },
        { goalDiff: 'desc' },
        { goalsFor: 'desc' },
      ],
    });

    // Group by letter
    const grouped: Record<string, GroupStanding[]> = {};
    for (const standing of allStandings) {
      if (!grouped[standing.groupLetter]) {
        grouped[standing.groupLetter] = [];
      }
      grouped[standing.groupLetter]!.push(standing);
    }

    return grouped;
  }

  /**
   * Get third place rankings (for R32 qualification)
   */
  static async getThirdPlaceRankings(): Promise<
    Prisma.ThirdPlaceRankingGetPayload<{ include: { team: true } }>[]
  > {
    return await prisma.thirdPlaceRanking.findMany({
      where: {
        rank: {
          not: null,
        },
      },
      include: {
        team: true,
      },
      orderBy: {
        rank: 'asc',
      },
    });
  }
}
