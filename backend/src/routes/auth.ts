import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import {
  generateMagicLinkToken,
  verifyMagicLinkToken,
  generateJWT,
} from '../auth/jwt';
import { emailService } from '../services/email';
import { config } from '../config';
import logger from '../logger';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  colboNumber: z.string().min(1),
});

// POST /auth/login - Send magic link
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, displayName, colboNumber } = loginSchema.parse(req.body);

    logger.info({ email }, 'Magic link login requested');

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          displayName,
          colboNumber,
          isApproved: false,
          role: 'USER',
          requestedAt: new Date(),
        },
      });

      logger.info({ userId: user.id, email }, 'New user created');

      // Send notification to admins about new signup
      // For now, just log it - in production would send email to all admins
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      });

      for (const admin of adminUsers) {
        await emailService.sendApprovalNotification({
          to: admin.email,
          displayName: user.displayName,
          colboNumber: user.colboNumber,
          approvalLink: `${config.isDevelopment ? 'http://localhost:3000' : 'https://your-domain.com'}/admin/users/${user.id}/approve`,
        });
      }
    }

    // Generate magic link token
    const magicToken = generateMagicLinkToken(email);
    const magicLink = `${config.isDevelopment ? 'http://localhost:3000' : 'https://your-domain.com'}/auth/callback?token=${magicToken}`;

    // Send magic link email
    await emailService.sendMagicLink({
      to: email,
      magicLink,
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    logger.error({ error }, 'Error in magic link login');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send magic link',
    });
  }
});

// GET /auth/callback - Verify magic link and issue JWT
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing or invalid token',
      });
      return;
    }

    // Verify magic link token
    const email = verifyMagicLinkToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Generate JWT
    const jwt = generateJWT({
      userId: user.id,
      email: user.email,
      isApproved: user.isApproved,
      role: user.role,
    });

    logger.info({ userId: user.id, email }, 'User logged in successfully');

    res.json({
      jwt,
      approved: user.isApproved,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        colboNumber: user.colboNumber,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error in auth callback');
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid or expired magic link',
    });
  }
});

export default router;
