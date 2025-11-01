import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireAdmin } from '../middlewares/admin';

const router = Router();
const adminController = new AdminController();

// All admin routes require admin authentication
router.use(requireAdmin);

// Match management routes
router.get('/matches', adminController.getMatches);
router.get('/matches/:id', adminController.getMatch);
router.post('/matches', adminController.createMatches);
router.put('/matches/:id', adminController.updateMatch);
router.post('/matches/:id/result', adminController.recordMatchResult);

export default router;
