import { Router } from 'express';
import { BracketController } from '../controllers/BracketController';

const router = Router();
const controller = new BracketController();

// Public endpoint - no auth required (or optional auth for rate limiting)
router.post('/calculate', controller.calculateBracket);

export default router;
