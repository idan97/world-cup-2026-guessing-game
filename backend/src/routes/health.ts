import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const healthController = new HealthController();

router.get('/healthz', healthController.healthCheck);

export default router;
