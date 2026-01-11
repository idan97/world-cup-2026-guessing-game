import { Router } from 'express';
import healthRoutes from './health';
import leagueRoutes from './leagues';
import formRoutes from './forms';
import adminRoutes from './admin';
import matchRoutes from './matches';
import standingsRoutes from './standings';
import simulateRoutes from './simulate';
import bracketRoutes from './bracket';

const router = Router();

// Mount routes with version prefix
router.use('/', healthRoutes);
router.use('/leagues', leagueRoutes);
router.use('/matches', matchRoutes);
router.use('/standings', standingsRoutes);
router.use('/forms', formRoutes);
router.use('/admin', adminRoutes);
router.use('/simulate', simulateRoutes);
router.use('/bracket', bracketRoutes);

export default router;
