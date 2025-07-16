import { Router } from 'express';
import { FormController } from '../controllers/FormController';
import {
  validateFormId,
  requireFormOwnership,
  preventFinalFormModification,
} from '../middlewares/form';

const router = Router();
const formController = new FormController();

// Public form routes (user must be authenticated via clerk middleware in main app)
router.get('/me', formController.getMyForm);
router.post('/', formController.createForm);

// Protected form routes (require form ownership)
// GET /forms/:id - Get form by ID (with ownership check)
router.get(
  '/:id',
  validateFormId,
  requireFormOwnership,
  formController.getForm
);

// GET /forms/:id/with-picks - Get form with all picks
router.get(
  '/:id/with-picks',
  validateFormId,
  requireFormOwnership,
  formController.getFormWithPicks
);

// PUT /forms/:id - Update form basic info (nickname, etc.)
router.put(
  '/:id',
  validateFormId,
  requireFormOwnership,
  preventFinalFormModification,
  formController.updateForm
);

// PUT /forms/:id/picks - Save picks (match, advance, top scorer)
router.put(
  '/:id/picks',
  validateFormId,
  requireFormOwnership,
  preventFinalFormModification,
  formController.updatePicks
);

// POST /forms/:id/submit - Mark form as submitted/final
router.post(
  '/:id/submit',
  validateFormId,
  requireFormOwnership,
  formController.submitForm
);

// DELETE /forms/:id - Delete form (allows user to recreate)
router.delete(
  '/:id',
  validateFormId,
  requireFormOwnership,
  preventFinalFormModification,
  formController.deleteForm
);

export default router;
