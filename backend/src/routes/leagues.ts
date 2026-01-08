import { Router } from 'express';
import { LeagueController } from '../controllers/LeagueController';
import { requireAuth } from '../middlewares/auth';
import {
  validateLeagueId,
  requireLeagueMembership,
  requireLeagueAdmin,
} from '../middlewares/league';

const router = Router();
const leagueController = new LeagueController();

// User league routes (require authentication)
router.get('/', requireAuth, leagueController.getMyLeagues);
router.post('/', requireAuth, leagueController.createLeague);
router.post('/:code/join', requireAuth, leagueController.joinLeague);

// League member routes (require league membership)
router.get(
  '/:id/leaderboard',
  validateLeagueId,
  requireLeagueMembership,
  leagueController.getLeagueLeaderboard
);
router.get(
  '/:id/messages',
  validateLeagueId,
  requireLeagueMembership,
  leagueController.getLeagueMessages
);

// League admin routes (require admin role)
router.post(
  '/:id/messages',
  validateLeagueId,
  requireLeagueAdmin,
  leagueController.createLeagueMessage
);
router.get(
  '/:id/members',
  validateLeagueId,
  requireLeagueAdmin,
  leagueController.getLeagueMembers
);
router.delete(
  '/:id/members/:uid',
  validateLeagueId,
  requireLeagueAdmin,
  leagueController.removeMember
);
router.post(
  '/:id/join-code/rotate',
  validateLeagueId,
  requireLeagueAdmin,
  leagueController.rotateJoinCode
);
router.post(
  '/:id/allow',
  validateLeagueId,
  requireLeagueAdmin,
  leagueController.addAllowEmail
);

export default router;
