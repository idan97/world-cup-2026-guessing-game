import { Router } from 'express';
import { SimulationController } from '../controllers/SimulationController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const simulationController = new SimulationController();

/**
 * POST /simulate/calculate
 * חישוב סימולציה כללית (מקבל leagueId בגוף הבקשה)
 */
router.post(
  '/calculate',
  requireAuth,
  simulationController.calculateSimulation
);

/**
 * POST /simulate/league/:id/calculate
 * חישוב סימולציה לליגה ספציפית
 */
router.post(
  '/league/:id/calculate',
  requireAuth,
  simulationController.calculateLeagueSimulation
);

/**
 * GET /simulate/league/:id/all-predictions
 * קבלת כל הניבויים של כל המשתתפים בליגה לחישוב בזמן אמת
 */
router.get(
  '/league/:id/all-predictions',
  requireAuth,
  simulationController.getLeaguePredictions
);

/**
 * GET /simulate/my
 * טעינת סימולציה שמורה של המשתמש המחובר
 */
router.get('/my', requireAuth, simulationController.getMySimulation);

/**
 * PUT /simulate/my
 * שמירת סימולציה של המשתמש המחובר
 */
router.put('/my', requireAuth, simulationController.saveMySimulation);

export default router;
