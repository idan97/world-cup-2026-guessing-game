import { Router } from 'express';
import healthRoutes from './health';
import leagueRoutes from './leagues';

const router = Router();

// Mount routes with version prefix
router.use('/', healthRoutes);
router.use('/leagues', leagueRoutes);

export default router;
