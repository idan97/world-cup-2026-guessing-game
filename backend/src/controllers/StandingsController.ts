import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GroupStandingModel } from '../models/GroupStanding';
import logger from '../logger';

const VALID_GROUPS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
];

export class StandingsController extends BaseController {
  /**
   * GET /standings
   * Get all group standings, optionally filtered by group letters
   * Query params: ?group=A&group=B (can specify multiple)
   */
  public getAllStandings = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      // Parse group query params (can be single or array)
      let groupLetters: string[] | undefined;
      const groupParam = req.query['group'];

      if (groupParam) {
        // Convert to array if single value, filter only strings
        groupLetters = Array.isArray(groupParam)
          ? groupParam.filter((g): g is string => typeof g === 'string')
          : typeof groupParam === 'string'
            ? [groupParam]
            : undefined;

        if (!groupLetters || groupLetters.length === 0) {
          return this.badRequest(res, 'Invalid group parameter format');
        }

        // Validate group letters
        const invalidGroups = groupLetters.filter(
          (g) => !VALID_GROUPS.includes(g.toUpperCase())
        );
        if (invalidGroups.length > 0) {
          return this.badRequest(
            res,
            `Invalid group letters: ${invalidGroups.join(', ')}. Valid groups: ${VALID_GROUPS.join(', ')}`
          );
        }

        // Normalize to uppercase
        groupLetters = groupLetters.map((g) => g.toUpperCase());
      }

      // Fetch standings
      const standings = await GroupStandingModel.findByGroups(groupLetters);

      // Group by letter for response
      type StandingType = (typeof standings)[number];
      const grouped: Record<string, StandingType[]> = {};
      for (const standing of standings) {
        if (!grouped[standing.groupLetter]) {
          grouped[standing.groupLetter] = [];
        }
        grouped[standing.groupLetter]!.push(standing);
      }

      logger.info(
        {
          groupsRequested: groupLetters?.length || 'all',
          totalStandings: standings.length,
        },
        'Fetched group standings'
      );

      return this.success(res, {
        groups: grouped,
        metadata: {
          groupsIncluded: Object.keys(grouped).sort(),
          totalGroups: Object.keys(grouped).length,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching group standings');
      return this.internalError(res, error);
    }
  };

  /**
   * GET /standings/:groupLetter
   * Get standings for a specific group
   */
  public getGroupStandings = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const groupLetter = req.params['groupLetter']?.toUpperCase();

      if (!groupLetter || !VALID_GROUPS.includes(groupLetter)) {
        return this.badRequest(
          res,
          `Invalid group letter: ${groupLetter}. Valid groups: ${VALID_GROUPS.join(', ')}`
        );
      }

      const standings = await GroupStandingModel.findByGroup(groupLetter);

      if (standings.length === 0) {
        return this.notFound(
          res,
          `No standings found for group ${groupLetter}`
        );
      }

      logger.info(
        { groupLetter, standingsCount: standings.length },
        'Fetched single group standings'
      );

      return this.success(res, {
        groupLetter,
        standings,
      });
    } catch (error) {
      logger.error(
        { error, groupLetter: req.params['groupLetter'] },
        'Error fetching single group standings'
      );
      return this.internalError(res, error);
    }
  };

  /**
   * GET /standings/third-place/rankings
   * Get third place rankings for R32 qualification
   */
  public getThirdPlaceRankings = async (
    _req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const rankings = await GroupStandingModel.getThirdPlaceRankings();

      logger.info(
        { rankingsCount: rankings.length },
        'Fetched third place rankings'
      );

      return this.success(res, rankings);
    } catch (error) {
      logger.error({ error }, 'Error fetching third place rankings');
      return this.internalError(res, error);
    }
  };
}
