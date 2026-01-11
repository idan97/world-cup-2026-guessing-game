import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { z } from 'zod';
import {
  simulateLeagueScoring,
  getAllLeaguePredictions,
} from '../services/SimulationService';
import prisma from '../db';
import logger from '../logger';

// Validation schema
const simulatedMatchResultSchema = z.object({
  matchId: z.string().min(1),
  team1Score: z.number().int().min(0),
  team2Score: z.number().int().min(0),
  winnerId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

const simulationRequestSchema = z.object({
  leagueId: z.string().min(1),
  simulatedResults: z.array(simulatedMatchResultSchema).min(1),
  actualTopScorer: z.string().optional().nullable(),
});

export class SimulationController extends BaseController {
  /**
   * POST /simulate/calculate
   * חישוב טבלת ניקוד מדומה עבור ליגה על בסיס תוצאות מדומות
   */
  public calculateSimulation = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      // אימות נתונים
      const result = simulationRequestSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid simulation data',
          result.error.errors
        );
      }

      const { leagueId, simulatedResults, actualTopScorer } = result.data;

      logger.info(
        {
          leagueId,
          resultsCount: simulatedResults.length,
          userId: req.auth?.userId,
        },
        'Calculating simulation'
      );

      // חישוב הסימולציה
      const leaderboard = await simulateLeagueScoring({
        leagueId,
        simulatedResults,
        actualTopScorer: actualTopScorer || null,
      });

      logger.info(
        {
          leagueId,
          entriesCount: leaderboard.length,
        },
        'Simulation calculated successfully'
      );

      return this.success(res, {
        leagueId,
        leaderboard,
        simulatedResultsCount: simulatedResults.length,
      });
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: req.auth?.userId,
          body: req.body,
        },
        'Error calculating simulation'
      );

      // טיפול בשגיאות ספציפיות
      if (error.message?.includes('not found')) {
        return this.notFound(res, error.message);
      }
      if (error.message?.includes('Invalid')) {
        return this.badRequest(res, error.message);
      }

      return this.internalError(res, error);
    }
  };

  /**
   * POST /simulate/league/:id/calculate
   * חישוב סימולציה לליגה ספציפית (קיצור דרך)
   */
  public calculateLeagueSimulation = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.params['id'];
      if (!leagueId) {
        return this.badRequest(res, 'League ID is required');
      }

      // אימות נתוני הסימולציה
      const simulationDataSchema = z.object({
        simulatedResults: z.array(simulatedMatchResultSchema).min(1),
        actualTopScorer: z.string().optional().nullable(),
      });

      const result = simulationDataSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid simulation data',
          result.error.errors
        );
      }

      const { simulatedResults, actualTopScorer } = result.data;

      logger.info(
        {
          leagueId,
          resultsCount: simulatedResults.length,
          userId: req.auth?.userId,
        },
        'Calculating league simulation'
      );

      // חישוב הסימולציה
      const leaderboard = await simulateLeagueScoring({
        leagueId,
        simulatedResults,
        actualTopScorer: actualTopScorer || null,
      });

      logger.info(
        {
          leagueId,
          entriesCount: leaderboard.length,
        },
        'League simulation calculated successfully'
      );

      return this.success(res, {
        leagueId,
        leaderboard,
        simulatedResultsCount: simulatedResults.length,
      });
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: req.auth?.userId,
          leagueId: req.params['id'],
        },
        'Error calculating league simulation'
      );

      if (error.message?.includes('not found')) {
        return this.notFound(res, error.message);
      }
      if (error.message?.includes('Invalid')) {
        return this.badRequest(res, error.message);
      }

      return this.internalError(res, error);
    }
  };

  /**
   * GET /simulate/league/:id/all-predictions
   * קבלת כל הניבויים של כל המשתתפים בליגה לחישוב בזמן אמת
   */
  public getLeaguePredictions = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.params['id'];
      if (!leagueId) {
        return this.badRequest(res, 'League ID is required');
      }

      logger.info(
        {
          leagueId,
          userId: req.auth?.userId,
        },
        'Fetching all league predictions for simulation'
      );

      const result = await getAllLeaguePredictions(leagueId);

      logger.info(
        {
          leagueId,
          formsCount: result.forms.length,
        },
        'League predictions fetched successfully'
      );

      return this.success(res, result);
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: req.auth?.userId,
          leagueId: req.params['id'],
        },
        'Error fetching league predictions'
      );

      if (error.message?.includes('not found')) {
        return this.notFound(res, error.message);
      }

      return this.internalError(res, error);
    }
  };

  /**
   * GET /simulate/my
   * טעינת סימולציה שמורה של המשתמש המחובר
   */
  public getMySimulation = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      logger.info(
        {
          userId,
        },
        'Fetching user simulation'
      );

      const simulation = await prisma.simulation.findUnique({
        where: { userId },
      });

      if (!simulation) {
        logger.info({ userId }, 'No simulation found for user');
        return this.success(res, { simulation: null });
      }

      logger.info(
        {
          userId,
          simulationId: simulation.id,
        },
        'User simulation fetched successfully'
      );

      return this.success(res, { simulation });
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: req.auth?.userId,
        },
        'Error fetching user simulation'
      );

      return this.internalError(res, error);
    }
  };

  /**
   * PUT /simulate/my
   * שמירת סימולציה של המשתמש המחובר
   */
  public saveMySimulation = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      // אימות נתונים
      const saveSchema = z.object({
        results: z.record(
          z.object({
            predScoreA: z.number().int().min(0),
            predScoreB: z.number().int().min(0),
          })
        ),
        topScorer: z.string().nullable().optional(),
      });

      const result = saveSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid simulation data',
          result.error.errors
        );
      }

      const { results, topScorer } = result.data;

      logger.info(
        {
          userId,
          resultsCount: Object.keys(results).length,
        },
        'Saving user simulation'
      );

      // שמירה או עדכון ב-DB
      const simulation = await prisma.simulation.upsert({
        where: { userId },
        update: {
          results,
          topScorer: topScorer || null,
        },
        create: {
          userId,
          results,
          topScorer: topScorer || null,
        },
      });

      logger.info(
        {
          userId,
          simulationId: simulation.id,
        },
        'User simulation saved successfully'
      );

      return this.success(res, { simulation });
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: req.auth?.userId,
          body: req.body,
        },
        'Error saving user simulation'
      );

      return this.internalError(res, error);
    }
  };
}
