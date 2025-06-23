import { Router } from 'express';
import { LeagueController } from '../controllers/LeagueController';
import {
  validateLeagueId,
  requireLeagueMembership,
  requireLeagueAdmin,
} from '../middlewares/league';

const router = Router();
const leagueController = new LeagueController();

// Public league routes
router.get('/', leagueController.getMyLeagues);
router.post('/', leagueController.createLeague);
router.post('/:code/join', leagueController.joinLeague);

// League member routes (require league membership)
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
