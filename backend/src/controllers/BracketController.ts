import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import * as BracketService from '../services/BracketService';
import { z } from 'zod';

const calculateBracketSchema = z.object({
  matchResults: z
    .array(
      z.object({
        matchId: z.string(),
        team1Score: z.number().int().min(0),
        team2Score: z.number().int().min(0),
      }),
    )
    .min(72),
});

export class BracketController extends BaseController {
  // POST /api/bracket/calculate
  public calculateBracket = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const result = calculateBracketSchema.safeParse(req.body);
    if (!result.success) {
      return this.badRequest(res, 'Invalid request data', result.error.errors);
    }

    const { matchResults } = result.data;

    // Validate we have at least 72 group stage results
    if (matchResults.length < 72) {
      return this.badRequest(
        res,
        `Expected at least 72 group stage results, got ${matchResults.length}`,
      );
    }

    try {
      // Calculate bracket
      const bracket =
        await BracketService.calculateKnockoutBracket(matchResults);

      return this.success(res, {
        isComplete: true,
        ...bracket,
      });
    } catch (error) {
      return this.internalError(res, error);
    }
  };
}
