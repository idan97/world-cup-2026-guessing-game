import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';

const router = Router();
const controller = new MatchController();

// Public match routes (no auth required for reading matches)
// GET /matches - Get all matches (with optional ?stage=GROUP query)
router.get('/', controller.getAllMatches);

// GET /matches/next - Get next upcoming matches (must be before /:id)
router.get('/next', controller.getNextMatches);

// GET /matches/stage/:stage - Get matches by stage
router.get('/stage/:stage', controller.getMatchesByStage);

// GET /matches/:id - Get single match by ID
router.get('/:id', controller.getMatchById);

export default router;

