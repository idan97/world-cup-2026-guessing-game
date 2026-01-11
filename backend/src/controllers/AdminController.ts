import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MatchModel } from '../models/Match';
import { updateMatchResult } from '../services/MatchResultService';
import { TournamentSettingsService } from '../services/TournamentSettingsService';
import { z } from 'zod';
import { Stage } from '@prisma/client';
import logger from '../logger';
import prisma from '../db';

// Validation schemas
const createMatchSchema = z.object({
  matchNumber: z.number().int().positive(),
  stage: z.nativeEnum(Stage),
  team1Code: z.string().min(1),
  team2Code: z.string().min(1),
  team1Name: z.string().optional(),
  team2Name: z.string().optional(),
  scheduledAt: z.string().datetime().or(z.date()),
  team1Id: z.string().nullable().optional(),
  team2Id: z.string().nullable().optional(),
  venue: z.string().optional(),
  venueCode: z.number().int().optional(),
});

const updateMatchSchema = z.object({
  stage: z.nativeEnum(Stage).optional(),
  team1Code: z.string().min(1).optional(),
  team2Code: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().or(z.date()).optional(),
  team1Id: z.string().nullable().optional(),
  team2Id: z.string().nullable().optional(),
  team1Score: z.number().int().min(0).nullable().optional(),
  team2Score: z.number().int().min(0).nullable().optional(),
  winnerId: z.string().nullable().optional(),
});

const matchResultSchema = z.object({
  team1Score: z.number().int().min(0),
  team2Score: z.number().int().min(0),
});

const bulkCreateMatchesSchema = z.array(createMatchSchema);

const updateTopScorerSchema = z.object({
  playerName: z.string().nullable(),
});

export class AdminController extends BaseController {
  // GET /admin/matches - List all matches with optional filters
  public getMatches = async (
    req: Request,
    res: Response,
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
      const matchId = req.params['id'];
      if (!matchId) {
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
    res: Response,
  ): Promise<Response> => {
    try {
      // Check if it's a single match or bulk
      if (Array.isArray(req.body)) {
        const result = bulkCreateMatchesSchema.safeParse(req.body);
        if (!result.success) {
          return this.badRequest(
            res,
            'Invalid matches data',
            result.error.errors,
          );
        }

        const matches = result.data.map((match) => ({
          matchNumber: match.matchNumber,
          stage: match.stage,
          team1Code: match.team1Code,
          team2Code: match.team2Code,
          ...(match.team1Name && { team1Name: match.team1Name }),
          ...(match.team2Name && { team2Name: match.team2Name }),
          scheduledAt:
            typeof match.scheduledAt === 'string'
              ? new Date(match.scheduledAt)
              : match.scheduledAt,
          team1Id: match.team1Id ?? null,
          team2Id: match.team2Id ?? null,
          ...(match.venue && { venue: match.venue }),
          ...(match.venueCode && { venueCode: match.venueCode }),
        }));

        await MatchModel.createMany(matches);

        logger.info(
          { count: matches.length, userId: req.auth.userId },
          'Bulk matches created',
        );

        return this.created(
          res,
          { count: matches.length },
          'Matches created successfully',
        );
      } else {
        const result = createMatchSchema.safeParse(req.body);
        if (!result.success) {
          return this.badRequest(
            res,
            'Invalid match data',
            result.error.errors,
          );
        }

        const matchData = {
          matchNumber: result.data.matchNumber,
          stage: result.data.stage,
          team1Code: result.data.team1Code,
          team2Code: result.data.team2Code,
          ...(result.data.team1Name && { team1Name: result.data.team1Name }),
          ...(result.data.team2Name && { team2Name: result.data.team2Name }),
          scheduledAt:
            typeof result.data.scheduledAt === 'string'
              ? new Date(result.data.scheduledAt)
              : result.data.scheduledAt,
          team1Id: result.data.team1Id ?? null,
          team2Id: result.data.team2Id ?? null,
          ...(result.data.venue && { venue: result.data.venue }),
          ...(result.data.venueCode && { venueCode: result.data.venueCode }),
        };

        const match = await MatchModel.create(matchData);

        logger.info(
          { matchId: match.id, userId: req.auth.userId },
          'Match created',
        );

        return this.created(res, match, 'Match created successfully');
      }
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error creating matches',
      );
      return this.internalError(res, error);
    }
  };

  // PUT /admin/matches/:id - Update match details
  public updateMatch = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const matchId = req.params['id'];
      if (!matchId) {
        return this.badRequest(res, 'Invalid match ID');
      }

      const result = updateMatchSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid match data', result.error.errors);
      }

      // Build update data object, removing undefined values
      const { scheduledAt, ...restData } = result.data;
      const updateData: Parameters<typeof MatchModel.update>[1] =
        Object.fromEntries(
          Object.entries(restData).filter(([, value]) => value !== undefined),
        ) as Parameters<typeof MatchModel.update>[1];

      // Handle scheduledAt separately (needs date conversion)
      if (scheduledAt !== undefined) {
        updateData.scheduledAt =
          typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
      }

      const match = await MatchModel.update(matchId, updateData);

      logger.info(
        { matchId, userId: req.auth.userId, changes: result.data },
        'Match updated',
      );

      return this.success(res, match, 'Match updated successfully');
    } catch (error) {
      logger.error(
        { error, matchId: req.params['id'], userId: req.auth.userId },
        'Error updating match',
      );
      return this.internalError(res, error);
    }
  };

  // POST /admin/matches/:id/result - Record match result
  public recordMatchResult = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const matchNumber = parseInt(req.params['id'] || '');
      if (isNaN(matchNumber)) {
        return this.badRequest(res, 'Invalid match number');
      }

      const result = matchResultSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid result data', result.error.errors);
      }

      // Find match by matchNumber to get its id
      const match = await prisma.match.findUnique({
        where: { matchNumber },
      });

      if (!match) {
        return this.notFound(res, 'Match not found');
      }

      // Use the MatchResultService which handles all cascading updates
      await updateMatchResult({
        matchId: match.id,
        team1Score: result.data.team1Score,
        team2Score: result.data.team2Score,
      });

      // Get updated match
      const updatedMatch = await prisma.match.findUnique({
        where: { id: match.id },
        include: {
          team1: true,
          team2: true,
          winner: true,
        },
      });

      logger.info(
        {
          matchNumber,
          matchId: match.id,
          userId: req.auth.userId,
          team1Score: result.data.team1Score,
          team2Score: result.data.team2Score,
        },
        'Match result recorded and standings updated',
      );

      return this.success(
        res,
        updatedMatch,
        'Match result recorded successfully',
      );
    } catch (error) {
      logger.error(
        { error, matchNumber: req.params['id'], userId: req.auth.userId },
        'Error recording match result',
      );

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }

      if (errorMessage.includes('already finished')) {
        return this.badRequest(res, errorMessage);
      }

      return this.internalError(res, error);
    }
  };

  // GET /admin/tournament/settings - Get tournament settings
  public getTournamentSettings = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const settings = await TournamentSettingsService.getSettings();
      return this.success(res, settings);
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error fetching tournament settings',
      );
      return this.internalError(res, error);
    }
  };

  // PUT /admin/tournament/top-scorer - Update actual top scorer
  public updateTopScorer = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const result = updateTopScorerSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid top scorer data',
          result.error.errors,
        );
      }

      await TournamentSettingsService.setActualTopScorer(
        result.data.playerName,
      );

      logger.info(
        { userId: req.auth.userId, playerName: result.data.playerName },
        'Top scorer updated',
      );

      return this.success(
        res,
        { actualTopScorer: result.data.playerName },
        'Top scorer updated successfully',
      );
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error updating top scorer',
      );
      return this.internalError(res, error);
    }
  };
}
