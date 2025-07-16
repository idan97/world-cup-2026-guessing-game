import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { z } from 'zod';
import { FormModel } from '../models/Form';
import { Stage, Outcome } from '@prisma/client';
import logger from '../logger';

// Validation schemas
const matchPickSchema = z.object({
  matchId: z.number().int().positive(),
  predScoreA: z.number().int().min(0),
  predScoreB: z.number().int().min(0),
  predOutcome: z.nativeEnum(Outcome),
});

const advancePickSchema = z.object({
  stage: z.nativeEnum(Stage).refine((stage) => stage !== 'GROUP', {
    message: 'Advance picks cannot be for GROUP stage',
  }),
  teamId: z.string().min(1),
});

const topScorerPickSchema = z.object({
  playerName: z.string().min(1).max(100),
});

const createFormSchema = z.object({
  nickname: z.string().min(1).max(100),
  matchPicks: z.array(matchPickSchema).optional(),
  advancePicks: z.array(advancePickSchema).optional(),
  topScorerPicks: z.array(topScorerPickSchema).optional(),
});

const updateFormSchema = z.object({
  nickname: z.string().min(1).max(100),
});

const picksSchema = z.object({
  matchPicks: z.array(matchPickSchema).optional(),
  advancePicks: z.array(advancePickSchema).optional(),
  topScorerPicks: z.array(topScorerPickSchema).optional(),
});

export class FormController extends BaseController {
  // GET /forms/me - Get user's form
  public getMyForm = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.auth.userId;
      const form = await FormModel.findByOwnerId(userId);

      if (!form) {
        return this.notFound(res, 'Form not found');
      }

      return this.success(res, form);
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId },
        'Error fetching user form'
      );
      return this.internalError(res, error);
    }
  };

  // GET /forms/:id - Get form by ID (with ownership check)
  public getForm = async (req: Request, res: Response): Promise<Response> => {
    try {
      const form = req.form!.data;
      return this.success(res, form);
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error fetching form'
      );
      return this.internalError(res, error);
    }
  };

  // GET /forms/:id/with-picks - Get form with all picks
  public getFormWithPicks = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const formId = req.form!['id'];
      const formWithPicks = await FormModel.getFormWithPicks(formId);

      if (!formWithPicks) {
        return this.notFound(res, 'Form not found');
      }

      return this.success(res, formWithPicks);
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error fetching form with picks'
      );
      return this.internalError(res, error);
    }
  };

  // POST /forms - Create new form
  public createForm = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = createFormSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid form data', result.error.errors);
      }

      const userId = req.auth.userId;

      // Check if user already has a form
      const hasForm = await FormModel.userHasForm(userId);
      if (hasForm) {
        return this.conflict(res, 'User already has a form');
      }

      // Create form
      const form = await FormModel.create(
        userId,
        result.data.nickname,
        result.data.matchPicks,
        result.data.advancePicks,
        result.data.topScorerPicks
      );

      logger.info(
        { formId: form.id, userId, nickname: form.nickname },
        'New form created'
      );

      return this.created(res, form, 'Form created successfully');
    } catch (error) {
      logger.error({ error, userId: req.auth.userId }, 'Error creating form');
      return this.internalError(res, error);
    }
  };

  // PUT /forms/:id - Update form basic info
  public updateForm = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = updateFormSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid form data', result.error.errors);
      }

      const formId = req.form!.id;

      // Update form
      const updatedForm = await FormModel.update(formId, result.data);

      logger.info(
        { formId, userId: req.auth.userId, changes: result.data },
        'Form updated'
      );

      return this.success(res, updatedForm, 'Form updated successfully');
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error updating form'
      );
      return this.internalError(res, error);
    }
  };

  // PUT /forms/:id/picks - Save picks
  public updatePicks = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = picksSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid picks data', result.error.errors);
      }
      const { matchPicks, advancePicks, topScorerPicks } = result.data;

      const formId = req.form!['id'];

      // Save picks to database
      await FormModel.savePicks(formId, {
        matchPicks: matchPicks?.map((pick) => ({
          ...pick,
          formId,
        })),
        advancePicks: advancePicks?.map((pick) => ({
          ...pick,
          formId,
        })),
        topScorerPicks: topScorerPicks?.map((pick) => ({
          ...pick,
          formId,
        })),
      });

      logger.info(
        {
          formId,
          userId: req.auth.userId,
          picksCount: {
            matchPicks: result.data.matchPicks?.length || 0,
            advancePicks: result.data.advancePicks?.length || 0,
            topScorerPicks: result.data.topScorerPicks?.length || 0,
          },
        },
        'Form picks updated'
      );

      return this.success(res, { formId, message: 'Picks saved successfully' });
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error updating picks'
      );
      return this.internalError(res, error);
    }
  };

  // POST /forms/:id/submit - Mark form as submitted
  public submitForm = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const formId = req.form!['id'];
      const form = req.form!.data!;

      // Check if form is already submitted
      if (form.isFinal) {
        return this.conflict(res, 'Form is already submitted');
      }

      // Mark form as submitted
      const submittedForm = await FormModel.markAsSubmitted(formId);

      logger.info({ formId, userId: req.auth.userId }, 'Form submitted');

      return this.success(res, submittedForm, 'Form submitted successfully');
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error submitting form'
      );
      return this.internalError(res, error);
    }
  };

  // DELETE /forms/:id - Delete form
  public deleteForm = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const formId = req.form!.id;

      await FormModel.delete(formId);

      logger.info({ formId, userId: req.auth.userId }, 'Form deleted');

      return this.success(res, null, 'Form deleted successfully');
    } catch (error) {
      logger.error(
        { error, formId: req.params['id'], userId: req.auth.userId },
        'Error deleting form'
      );
      return this.internalError(res, error);
    }
  };
}
