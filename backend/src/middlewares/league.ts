import { Request, Response, NextFunction } from 'express';
import { LeagueModel } from '../models/League';
import { LeagueRole } from '@prisma/client';

// Validate that league ID exists in params
export const validateLeagueId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'League ID is required',
    });
    return;
  }

  // Attach league ID to request
  req.league = { id, isAdmin: false };
  next();
};

// Require user to be a member of the league
// NOTE: This middleware assumes validateLeagueId has already run
export const requireLeagueMembership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const leagueId = req.league!.id;
    const userId = req.auth.userId;

    const membership = await LeagueModel.getUserMembership(leagueId, userId);

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'Not a member of this league',
      });
      return;
    }

    // Attach membership info to request
    req.league!.membership = membership;
    req.league!.isAdmin = membership.role === LeagueRole.ADMIN;

    next();
  } catch {
    res.status(500).json({
      success: false,
      message: 'Error checking league membership',
    });
  }
};

// Require user to be an admin of the league
// NOTE: This middleware assumes validateLeagueId has already run
export const requireLeagueAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const leagueId = req.league!.id;
    const userId = req.auth.userId;

    const membership = await LeagueModel.getUserMembership(leagueId, userId);

    if (!membership || membership.role !== LeagueRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only league admins can perform this action',
      });
      return;
    }

    // Attach membership info to request
    req.league!.membership = membership;
    req.league!.isAdmin = true;

    next();
  } catch {
    res.status(500).json({
      success: false,
      message: 'Error checking league admin status',
    });
  }
};
