import { Request, Response, NextFunction } from 'express';
import { FormModel } from '../models/Form';

// Validate that form ID exists in params
export const validateFormId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Form ID is required',
    });
    return;
  }

  // Attach form ID to request
  req.form = { id, isOwner: false };
  next();
};

// Require user to be the owner of the form
// NOTE: This middleware assumes validateFormId has already run
export const requireFormOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const formId = req.form!.id;
    const userId = req.auth.userId;

    const form = await FormModel.findById(formId);

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found',
      });
      return;
    }

    if (form.ownerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only access your own form',
      });
      return;
    }

    // Attach form info to request
    req.form!.data = form;
    req.form!.isOwner = true;

    next();
  } catch {
    res.status(500).json({
      success: false,
      message: 'Error checking form ownership',
    });
  }
};

// Prevent modifications to final (submitted) forms
// NOTE: This middleware assumes requireFormOwnership has already run
export const preventFinalFormModification = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const form = req.form!.data!;

  if (form.isFinal) {
    res.status(409).json({
      success: false,
      message: 'Cannot modify a submitted form',
    });
    return;
  }

  next();
};
