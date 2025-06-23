import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class HealthController extends BaseController {
  public healthCheck = (_req: Request, res: Response): Response => {
    return this.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };
}
