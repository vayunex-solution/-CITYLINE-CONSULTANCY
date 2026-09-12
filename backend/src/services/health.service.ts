/**
 * CITYLINE CONSULTANCY — Health Check Service
 * Returns minimal operational health status without leaking internal subsystem details.
 */

import { HealthResponse } from '@cityline/shared';

export class HealthService {
  public getHealthStatus(): HealthResponse {
    return {
      status: 'ok',
    };
  }
}

export const healthService = new HealthService();
