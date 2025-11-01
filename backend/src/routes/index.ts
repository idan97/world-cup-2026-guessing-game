import { Router } from 'express';
import healthRoutes from './health';
import leagueRoutes from './leagues';
import formRoutes from './forms';
import adminRoutes from './admin';

const router = Router();

// Mount routes with version prefix
router.use('/', healthRoutes);
router.use('/leagues', leagueRoutes);
router.use('/forms', formRoutes);
router.use('/admin', adminRoutes);

export default router;
