import { Router } from 'express';
import { PredictionsController } from '../controllers/PredictionsController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const controller = new PredictionsController();

// All prediction routes require authentication
router.use(requireAuth);

// GET /predictions/my - Get user's predictions
router.get('/my', controller.getMyPredictions);

// POST /predictions/matches - Create/update match predictions
router.post('/matches', controller.createMatchPredictions);

// POST /predictions/advances - Create/update advance predictions
router.post('/advances', controller.createAdvancePredictions);

// POST /predictions/top-scorer - Create/update top scorer prediction
router.post('/top-scorer', controller.createTopScorerPrediction);

export default router;

