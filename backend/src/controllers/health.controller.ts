/**
 * CITYLINE CONSULTANCY — Health Controller
 * Delivers health response payload via standard ApiResponse envelope.
 */

import { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { sendSuccess } from '../utils/api-response';

export class HealthController {
  public check(req: Request, res: Response): void {
    const healthData = healthService.getHealthStatus();
    sendSuccess(res, healthData, 200, req.requestId);
  }
}

export const healthController = new HealthController();
