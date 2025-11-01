import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MatchModel } from '../models/Match';
import { z } from 'zod';
import { Stage } from '@prisma/client';
import logger from '../logger';

// Validation schemas
const createMatchSchema = z.object({
  id: z.number().int().positive(),
  stage: z.nativeEnum(Stage),
  slot: z.string().min(1),
  kickoff: z.string().datetime().or(z.date()),
  teamAId: z.string().nullable().optional(),
  teamBId: z.string().nullable().optional(),
});

const updateMatchSchema = z.object({
  stage: z.nativeEnum(Stage).optional(),
  slot: z.string().min(1).optional(),
  kickoff: z.string().datetime().or(z.date()).optional(),
  teamAId: z.string().nullable().optional(),
  teamBId: z.string().nullable().optional(),
  scoreA: z.number().int().min(0).nullable().optional(),
  scoreB: z.number().int().min(0).nullable().optional(),
  winnerTeamId: z.string().nullable().optional(),
});

const matchResultSchema = z.object({
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
  winnerTeamId: z.string().nullable().optional(),
});

const bulkCreateMatchesSchema = z.array(createMatchSchema);

export class AdminController extends BaseController {
  // GET /admin/matches - List all matches with optional filters
  public getMatches = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const stage = req.query['stage'] as Stage | undefined;
      const upcoming = req.query['upcoming'] === 'true';

      let matches;
      if (upcoming) {
        const limit = parseInt((req.query['limit'] as string) || '10', 10);
        matches = await MatchModel.findUpcoming(limit);
      } else if (stage) {
        matches = await MatchModel.findByStage(stage);
      } else {
        matches = await MatchModel.findAll();
      }

      return this.success(res, matches);
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // GET /admin/matches/:id - Get specific match
  public getMatch = async (req: Request, res: Response): Promise<Response> => {
    try {
      const matchId = parseInt(req.params['id'] || '');
      if (isNaN(matchId)) {
        return this.badRequest(res, 'Invalid match ID');
      }

      const match = await MatchModel.findById(matchId);
      if (!match) {
        return this.notFound(res, 'Match not found');
      }

      return this.success(res, match);
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // POST /admin/matches - Create/import matches (bulk)
  public createMatches = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      // Check if it's a single match or bulk
      if (Array.isArray(req.body)) {
        const result = bulkCreateMatchesSchema.safeParse(req.body);
        if (!result.success) {
          return this.badRequest(
            res,
            'Invalid matches data',
            result.error.errors
          );
        }

        const matches = result.data.map((match) => ({
          id: match.id,
          stage: match.stage,
          slot: match.slot,
          kickoff:
            typeof match.kickoff === 'string'
              ? new Date(match.kickoff)
              : match.kickoff,
          teamAId: match.teamAId ?? null,
          teamBId: match.teamBId ?? null,
        }));

        await MatchModel.createMany(matches);

        logger.info(
          { count: matches.length, userId: req.auth.userId },
          'Bulk matches created'
        );

        return this.created(
          res,
          { count: matches.length },
          'Matches created successfully'
        );
      } else {
        const result = createMatchSchema.safeParse(req.body);
        if (!result.success) {
          return this.badRequest(
            res,
            'Invalid match data',
            result.error.errors
          );
        }

        const matchData = {
          id: result.data.id,
          stage: result.data.stage,
          slot: result.data.slot,
          kickoff:
            typeof result.data.kickoff === 'string'
              ? new Date(result.data.kickoff)
              : result.data.kickoff,
          teamAId: result.data.teamAId ?? null,
          teamBId: result.data.teamBId ?? null,
        };

        const match = await MatchModel.create(matchData);

        logger.info(
          { matchId: match.id, userId: req.auth.userId },
          'Match created'
        );

        return this.created(res, match, 'Match created successfully');
      }
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error creating matches'
      );
      return this.internalError(res, error);
    }
  };

  // PUT /admin/matches/:id - Update match details
  public updateMatch = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const matchId = parseInt(req.params['id'] || '');
      if (isNaN(matchId)) {
        return this.badRequest(res, 'Invalid match ID');
      }

      const result = updateMatchSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid match data', result.error.errors);
      }

      const updateData: any = { ...result.data };
      if (updateData.kickoff && typeof updateData.kickoff === 'string') {
        updateData.kickoff = new Date(updateData.kickoff);
      }

      const match = await MatchModel.update(matchId, updateData);

      logger.info(
        { matchId, userId: req.auth.userId, changes: result.data },
        'Match updated'
      );

      return this.success(res, match, 'Match updated successfully');
    } catch (error) {
      logger.error(
        { error, matchId: req.params['id'], userId: req.auth.userId },
        'Error updating match'
      );
      return this.internalError(res, error);
    }
  };

  // POST /admin/matches/:id/result - Record match result
  public recordMatchResult = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const matchId = parseInt(req.params['id'] || '');
      if (isNaN(matchId)) {
        return this.badRequest(res, 'Invalid match ID');
      }

      const result = matchResultSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid result data', result.error.errors);
      }

      // Determine winner if not provided
      let winnerTeamId: string | null = result.data.winnerTeamId ?? null;
      if (!winnerTeamId && result.data.scoreA !== result.data.scoreB) {
        // Fetch match to get team IDs
        const match = await MatchModel.findById(matchId);
        if (!match) {
          return this.notFound(res, 'Match not found');
        }

        if (result.data.scoreA > result.data.scoreB) {
          winnerTeamId = match.teamAId;
        } else if (result.data.scoreB > result.data.scoreA) {
          winnerTeamId = match.teamBId;
        }
      }

      const updatedMatch = await MatchModel.updateResult(
        matchId,
        result.data.scoreA,
        result.data.scoreB,
        winnerTeamId
      );

      logger.info(
        {
          matchId,
          userId: req.auth.userId,
          scoreA: result.data.scoreA,
          scoreB: result.data.scoreB,
          winnerTeamId,
        },
        'Match result recorded'
      );

      return this.success(
        res,
        updatedMatch,
        'Match result recorded successfully'
      );
    } catch (error) {
      logger.error(
        { error, matchId: req.params['id'], userId: req.auth.userId },
        'Error recording match result'
      );
      return this.internalError(res, error);
    }
  };
}
