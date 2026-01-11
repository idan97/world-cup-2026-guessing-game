import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { z } from 'zod';
import { FormModel } from '../models/Form';
import { MatchModel } from '../models/Match';
import { Stage, Outcome } from '@prisma/client';
import logger from '../logger';
import prisma from '../db';

// Validation schemas
const createMatchPredictionSchema = z.object({
  matchId: z.string().min(1),
  predScoreA: z.number().int().min(0),
  predScoreB: z.number().int().min(0),
});

const advancePickSchema = z.object({
  stage: z.nativeEnum(Stage).refine((stage) => stage !== 'GROUP', {
    message: 'Advance picks cannot be for GROUP stage',
  }),
  teamId: z.string().min(1),
});

const bulkMatchPredictionsSchema = z.object({
  predictions: z.array(createMatchPredictionSchema).min(1),
});

const advancePredictionsSchema = z.object({
  predictions: z.array(advancePickSchema).min(1),
});

const topScorerPredictionSchema = z.object({
  playerName: z.string().min(1).max(100),
});

export class PredictionsController extends BaseController {
  /**
   * POST /predictions/matches
   * Create or update match predictions
   */
  public createMatchPredictions = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = bulkMatchPredictionsSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid predictions data',
          result.error.errors
        );
      }

      const userId = req.auth.userId;

      // Get or create user's form
      let form = await FormModel.findByOwnerId(userId);
      if (!form) {
        return this.badRequest(
          res,
          'User does not have a form. Please create a form first.'
        );
      }

      // Check if form is locked
      if (form.isFinal) {
        return this.forbidden(res, 'Form is locked and cannot be modified');
      }

      // Validate all match IDs exist
      const matchIds = result.data.predictions.map((p) => p.matchId);
      const matches = await MatchModel.findByIds(matchIds);

      if (matches.length !== matchIds.length) {
        const foundIds = matches.map((m) => m.id);
        const missingIds = matchIds.filter((id) => !foundIds.includes(id));
        return this.badRequest(
          res,
          `Invalid match IDs: ${missingIds.join(', ')}`
        );
      }

      // Calculate outcomes and save picks
      const matchPicks = result.data.predictions.map((pred) => {
        let predOutcome: Outcome;
        if (pred.predScoreA > pred.predScoreB) {
          predOutcome = 'W';
        } else if (pred.predScoreA < pred.predScoreB) {
          predOutcome = 'L';
        } else {
          predOutcome = 'D';
        }

        return {
          formId: form!.id,
          matchId: pred.matchId,
          predScoreA: pred.predScoreA,
          predScoreB: pred.predScoreB,
          predOutcome,
        };
      });

      await FormModel.savePicks(form.id, {
        matchPicks,
      });

      logger.info(
        {
          formId: form.id,
          userId,
          predictionsCount: matchPicks.length,
        },
        'Match predictions saved'
      );

      return this.success(res, {
        message: 'Match predictions saved successfully',
        count: matchPicks.length,
      });
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error saving match predictions'
      );
      return this.internalError(res, error);
    }
  };

  /**
   * POST /predictions/advances
   * Create or update advance predictions
   */
  public createAdvancePredictions = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = advancePredictionsSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid predictions data',
          result.error.errors
        );
      }

      const userId = req.auth.userId;

      // Get user's form
      let form = await FormModel.findByOwnerId(userId);
      if (!form) {
        return this.badRequest(
          res,
          'User does not have a form. Please create a form first.'
        );
      }

      // Check if form is locked
      if (form.isFinal) {
        return this.forbidden(res, 'Form is locked and cannot be modified');
      }

      // Validate all team IDs exist
      const teamIds = [
        ...new Set(result.data.predictions.map((p) => p.teamId)),
      ];
      const teams = await prisma.team.findMany({
        where: {
          id: {
            in: teamIds,
          },
        },
      });

      if (teams.length !== teamIds.length) {
        const foundIds = teams.map((t) => t.id);
        const missingIds = teamIds.filter((id) => !foundIds.includes(id));
        return this.badRequest(
          res,
          `Invalid team IDs: ${missingIds.join(', ')}`
        );
      }

      // Save advance picks
      const advancePicks = result.data.predictions.map((pred) => ({
        formId: form!.id,
        stage: pred.stage,
        teamId: pred.teamId,
      }));

      await FormModel.savePicks(form.id, {
        advancePicks,
      });

      logger.info(
        {
          formId: form.id,
          userId,
          predictionsCount: advancePicks.length,
        },
        'Advance predictions saved'
      );

      return this.success(res, {
        message: 'Advance predictions saved successfully',
        count: advancePicks.length,
      });
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error saving advance predictions'
      );
      return this.internalError(res, error);
    }
  };

  /**
   * POST /predictions/top-scorer
   * Create or update top scorer prediction
   */
  public createTopScorerPrediction = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = topScorerPredictionSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid prediction data',
          result.error.errors
        );
      }

      const userId = req.auth.userId;

      // Get user's form
      let form = await FormModel.findByOwnerId(userId);
      if (!form) {
        return this.badRequest(
          res,
          'User does not have a form. Please create a form first.'
        );
      }

      // Check if form is locked
      if (form.isFinal) {
        return this.forbidden(res, 'Form is locked and cannot be modified');
      }

      // Save top scorer pick
      await FormModel.savePicks(form.id, {
        topScorerPicks: [
          {
            formId: form.id,
            playerName: result.data.playerName,
          },
        ],
      });

      logger.info(
        {
          formId: form.id,
          userId,
          playerName: result.data.playerName,
        },
        'Top scorer prediction saved'
      );

      return this.success(res, {
        message: 'Top scorer prediction saved successfully',
        playerName: result.data.playerName,
      });
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error saving top scorer prediction'
      );
      return this.internalError(res, error);
    }
  };

  /**
   * GET /predictions/my
   * Get all predictions for the authenticated user
   */
  public getMyPredictions = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const userId = req.auth.userId;

      const form = await FormModel.findByOwnerId(userId);

      if (!form) {
        return this.notFound(res, 'No form found for this user');
      }

      // Get form with all picks
      const formWithPicks = await FormModel.getFormWithPicks(form.id);

      logger.info(
        {
          formId: form.id,
          userId,
        },
        'Fetched user predictions'
      );

      return this.success(res, formWithPicks);
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error fetching user predictions'
      );
      return this.internalError(res, error);
    }
  };
}
