import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { z } from 'zod';
import { LeagueModel } from '../models/League';
import { LeagueRole } from '@prisma/client';
import logger from '../logger';

// Validation schemas
const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const createMessageSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  pinned: z.boolean().default(false),
});

const addAllowEmailSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(LeagueRole),
});

export class LeagueController extends BaseController {
  // GET /leagues - List user's leagues
  public getMyLeagues = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const userId = req.auth.userId;
      const membershipData = await LeagueModel.getUserLeagues(userId);

      // Transform data to include role and member count
      const leagues = membershipData.map((membership) => ({
        id: membership.leagueId,
        name: membership.league.name,
        description: membership.league.description,
        joinCode: membership.league.joinCode,
        createdAt: membership.league.createdAt,
        role: membership.role,
        memberCount: membership.league._count.members,
      }));

      return this.success(res, leagues);
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // POST /leagues - Create new league
  public createLeague = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const result = createLeagueSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid league data', result.error.errors);
      }

      const userId = req.auth.userId;
      const joinCode = LeagueModel.generateJoinCode();

      // Create league
      const league = await LeagueModel.create(
        result.data.name,
        result.data.description || null,
        joinCode
      );

      // Add creator as admin
      await LeagueModel.addMember(league.id, userId, LeagueRole.ADMIN);

      logger.info(
        { leagueId: league.id, userId, name: league.name },
        'New league created'
      );
      return this.created(res, league, 'League created successfully');
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // POST /leagues/:code/join - Join league by code
  public joinLeague = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const { code } = req.params;
      if (!code || code.length !== 8) {
        return this.badRequest(res, 'Invalid join code');
      }

      const userId = req.auth.userId;

      // Find league by join code
      const league = await LeagueModel.findByJoinCode(code.toUpperCase());
      if (!league) {
        return this.notFound(res, 'League not found');
      }

      // Check if already a member
      const existingMembership = await LeagueModel.getUserMembership(
        league.id,
        userId
      );
      if (existingMembership) {
        return this.conflict(res, 'Already a member of this league');
      }

      // Add user as member
      await LeagueModel.addMember(league.id, userId, LeagueRole.PLAYER);

      logger.info(
        { leagueId: league.id, userId, joinCode: code },
        'User joined league'
      );

      return this.success(res, league, 'Successfully joined league');
    } catch (error) {
      logger.error(
        { error, userId: req.auth.userId, joinCode: req.params['code'] },
        'Error joining league'
      );
      return this.internalError(res, error);
    }
  };

  // GET /leagues/:id/messages - Get league messages
  public getLeagueMessages = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const messages = await LeagueModel.getLeagueMessages(leagueId);
      return this.success(res, messages);
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // POST /leagues/:id/messages - Create league message (ADMIN only)
  public createLeagueMessage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const userId = req.auth.userId;

      const result = createMessageSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(
          res,
          'Invalid message data',
          result.error.errors
        );
      }

      const message = await LeagueModel.createLeagueMessage(
        leagueId,
        userId,
        result.data.title,
        result.data.body,
        result.data.pinned
      );

      logger.info(
        { leagueId, messageId: message.id, userId },
        'League message created'
      );

      return this.created(res, message, 'Message created successfully');
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // GET /leagues/:id/members - List league members (ADMIN only)
  public getLeagueMembers = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const members = await LeagueModel.getLeagueMembers(leagueId);
      return this.success(res, members);
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // DELETE /leagues/:id/members/:uid - Remove member (ADMIN only)
  public removeMember = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const { uid } = req.params;
      const userId = req.auth.userId;

      if (!uid) {
        return this.badRequest(res, 'User ID is required');
      }

      // Can't remove self
      if (userId === uid) {
        return this.badRequest(res, 'Cannot remove yourself from the league');
      }

      // Check if target user is a member
      const targetMembership = await LeagueModel.getUserMembership(
        leagueId,
        uid
      );
      if (!targetMembership) {
        return this.notFound(res, 'Member not found');
      }

      // Remove the member
      await LeagueModel.removeMember(leagueId, uid);

      logger.info(
        { leagueId, adminUserId: userId, targetUserId: uid },
        'Member removed from league'
      );

      return this.success(res, null, 'Member removed successfully');
    } catch (error) {
      logger.error(
        {
          error,
          leagueId: req.league!.id,
          adminUserId: req.auth.userId,
          targetUserId: req.params['uid'],
        },
        'Error removing member'
      );
      return this.internalError(res, error);
    }
  };

  // POST /leagues/:id/join-code/rotate - Generate new join code (ADMIN only)
  public rotateJoinCode = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const userId = req.auth.userId;

      const newJoinCode = LeagueModel.generateJoinCode();
      await LeagueModel.update(leagueId, { joinCode: newJoinCode });

      logger.info(
        { leagueId, userId, newJoinCode },
        'League join code rotated'
      );

      return this.success(
        res,
        { joinCode: newJoinCode },
        'Join code updated successfully'
      );
    } catch (error) {
      return this.internalError(res, error);
    }
  };

  // POST /leagues/:id/allow - Add email to allow list (ADMIN only)
  public addAllowEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const leagueId = req.league!.id;
      const userId = req.auth.userId;

      const result = addAllowEmailSchema.safeParse(req.body);
      if (!result.success) {
        return this.badRequest(res, 'Invalid email data', result.error.errors);
      }

      await LeagueModel.addToAllowList(
        leagueId,
        result.data.email,
        result.data.role
      );

      logger.info(
        {
          leagueId,
          userId,
          email: result.data.email,
          role: result.data.role,
        },
        'Email added to league allow list'
      );

      return this.success(res, null, 'Email added to allow list');
    } catch (error) {
      return this.internalError(res, error);
    }
  };
}
