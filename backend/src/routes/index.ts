import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

// Mount routes with version prefix
router.use('/', healthRoutes);

export default router;
