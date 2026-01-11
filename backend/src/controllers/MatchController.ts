import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MatchModel } from '../models/Match';
import { Stage } from '@prisma/client';
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

export class MatchController extends BaseController {
  // GET /matches - Get all matches with filters
  // Query params:
  //   ?stage=GROUP - filter by stage
  //   ?group=A - filter by group (for GROUP stage only)
  //   ?upcoming=true - only upcoming matches
  //   ?limit=10 - limit number of results
  public getAllMatches = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const stage = req.query['stage'] as Stage | undefined;
      const groupLetter = req.query['group'] as string | undefined;
      const upcoming = req.query['upcoming'] === 'true';
      const limitParam = req.query['limit'] as string | undefined;
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      // Validate stage
      if (stage && !Object.values(Stage).includes(stage)) {
        return this.badRequest(res, `Invalid stage: ${stage}`);
      }

      // Validate group letter
      if (groupLetter && !VALID_GROUPS.includes(groupLetter.toUpperCase())) {
        return this.badRequest(
          res,
          `Invalid group letter: ${groupLetter}. Valid groups: ${VALID_GROUPS.join(', ')}`
        );
      }

      // Group filter only makes sense for GROUP stage
      if (groupLetter && stage && stage !== 'GROUP') {
        return this.badRequest(
          res,
          'Group filter can only be used with GROUP stage'
        );
      }

      // Validate limit
      if (limit && (isNaN(limit) || limit <= 0)) {
        return this.badRequest(res, 'Limit must be a positive number');
      }

      // Fetch matches with filters
      const filters: any = {};
      if (stage) filters.stage = stage;
      if (groupLetter) filters.groupLetter = groupLetter.toUpperCase();
      if (upcoming) filters.upcoming = upcoming;
      if (limit) filters.limit = limit;

      const matches = await MatchModel.findWithFilters(filters);

      logger.info(
        {
          matchCount: matches.length,
          filters: { stage, groupLetter, upcoming, limit },
        },
        'Fetched matches with filters'
      );

      return this.success(res, matches);
    } catch (error) {
      logger.error({ error }, 'Error fetching matches');
      return this.internalError(res, error);
    }
  };

  // GET /matches/next - Get next upcoming matches
  // Query params:
  //   ?userId=xxx - user ID (for future personalization)
  //   ?window=2d - time window (e.g., 2d = 2 days)
  public getNextMatches = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const windowParam = req.query['window'] as string | undefined;

      // Parse window (default 2 days)
      let windowMs = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
      if (windowParam) {
        const match = windowParam.match(/^(\d+)(d|h)$/);
        if (match) {
          const value = parseInt(match[1]!, 10);
          const unit = match[2]!;
          windowMs =
            unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 60 * 1000;
        }
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + windowMs);

      // Get upcoming matches within window
      const matches = await MatchModel.findWithFilters({
        upcoming: true,
        limit: 10,
      });

      // Filter by window
      const filteredMatches = matches.filter(
        (m) => m.scheduledAt >= now && m.scheduledAt <= endTime
      );

      logger.info(
        { matchCount: filteredMatches.length, window: windowParam },
        'Fetched next matches'
      );

      return this.success(res, filteredMatches);
    } catch (error) {
      logger.error({ error }, 'Error fetching next matches');
      return this.internalError(res, error);
    }
  };

  // GET /matches/:id - Get single match
  public getMatchById = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const id = req.params['id'];

      if (!id) {
        return this.badRequest(res, 'Match ID is required');
      }

      const match = await MatchModel.findById(id);

      if (!match) {
        return this.notFound(res, 'Match not found');
      }

      return this.success(res, match);
    } catch (error) {
      logger.error(
        { error, matchId: req.params['id'] },
        'Error fetching match'
      );
      return this.internalError(res, error);
    }
  };

  // GET /matches/stage/:stage - Get matches by stage
  public getMatchesByStage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const stage = req.params['stage'] as Stage;

      if (!Object.values(Stage).includes(stage)) {
        return this.badRequest(res, `Invalid stage: ${stage}`);
      }

      const matches = await MatchModel.findByStage(stage);

      logger.info(
        { matchCount: matches.length, stage },
        'Fetched matches by stage'
      );

      return this.success(res, matches);
    } catch (error) {
      logger.error(
        { error, stage: req.params['stage'] },
        'Error fetching matches by stage'
      );
      return this.internalError(res, error);
    }
  };
}
