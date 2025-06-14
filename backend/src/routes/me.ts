import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware';
import prisma from '../db';
import logger from '../logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /me - Get current user profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        colboNumber: true,
        role: true,
        isApproved: true,
        requestedAt: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error(
      { error, userId: req.user!.userId },
      'Error fetching user profile'
    );
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile',
    });
  }
});

export default router;
