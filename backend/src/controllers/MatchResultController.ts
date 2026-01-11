import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { updateMatchResult } from '../services/MatchResultService';
import logger from '../logger';
import { z } from 'zod';

const updateResultSchema = z.object({
  team1Score: z.number().int().min(0).max(20),
  team2Score: z.number().int().min(0).max(20),
});

export class MatchResultController extends BaseController {
  /**
   * POST /api/admin/matches/:matchId/result
   * Update match result (admin only)
   */
  public updateResult = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const matchId = req.params['matchId'];

      if (!matchId) {
        return this.badRequest(res, 'Match ID is required');
      }

      // Validate request body
      const result = updateResultSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid request data',
          result.error.errors,
        );
      }

      const { team1Score, team2Score } = result.data;

      // Update match result (this triggers all cascading updates)
      await updateMatchResult({
        matchId,
        team1Score,
        team2Score,
      });

      logger.info(
        {
          matchId,
          team1Score,
          team2Score,
          userId: req.auth?.userId,
        },
        'Match result updated',
      );

      return this.success(res, {
        message: 'Match result updated successfully',
        matchId,
        team1Score,
        team2Score,
      });
    } catch (error) {
      logger.error(
        { error, matchId: req.params['matchId'], userId: req.auth?.userId },
        'Error updating match result',
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
}
