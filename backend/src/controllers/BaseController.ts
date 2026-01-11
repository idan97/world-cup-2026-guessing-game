import { Response } from 'express';
import logger from '../logger';

export abstract class BaseController {
  protected success(res: Response, data?: unknown, message?: string): Response {
    return res.status(200).json({
      success: true,
      message: message || 'Success',
      data,
    });
  }

  protected created(res: Response, data?: unknown, message?: string): Response {
    return res.status(201).json({
      success: true,
      message: message || 'Created successfully',
      data,
    });
  }

  protected badRequest(
    res: Response,
    message?: string,
    errors?: unknown,
  ): Response {
    return res.status(400).json({
      success: false,
      message: message || 'Bad Request',
      errors,
    });
  }

  protected unauthorized(res: Response, message?: string): Response {
    return res.status(401).json({
      success: false,
      message: message || 'Unauthorized',
    });
  }

  protected forbidden(res: Response, message?: string): Response {
    return res.status(403).json({
      success: false,
      message: message || 'Forbidden',
    });
  }

  protected notFound(res: Response, message?: string): Response {
    return res.status(404).json({
      success: false,
      message: message || 'Not Found',
    });
  }

  protected conflict(res: Response, message?: string): Response {
    return res.status(409).json({
      success: false,
      message: message || 'Conflict',
    });
  }

  protected internalError(
    res: Response,
    error?: unknown,
    message?: string,
  ): Response {
    logger.error({ error }, 'Internal server error');
    return res.status(500).json({
      success: false,
      message: message || 'Internal Server Error',
    });
  }
}
