import { Router } from 'express';
import { StandingsController } from '../controllers/StandingsController';

const router = Router();
const controller = new StandingsController();

// Public standings routes (no auth required for reading standings)

// GET /standings/third-place/rankings - Get third place rankings (must come before /:groupLetter)
router.get('/third-place/rankings', controller.getThirdPlaceRankings);

// GET /standings - Get all standings (with optional ?group=A&group=B query)
router.get('/', controller.getAllStandings);

// GET /standings/:groupLetter - Get standings for specific group
router.get('/:groupLetter', controller.getGroupStandings);

export default router;
