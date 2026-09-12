/**
 * CITYLINE CONSULTANCY — Health Check Service
 * Inspects runtime subsystem status and generates health metadata.
 */

import { HealthResponse } from '@cityline/shared';
import { env } from '../config/env.config';
import { storageConfig, initializeStorageFoundation } from '../config/storage.config';

const startTime = Date.now();

export class HealthService {
  public getHealthStatus(): HealthResponse {
    // Check storage readiness without throwing
    const storageOk = storageConfig.isOperational || initializeStorageFoundation();

    return {
      status: storageOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      environment: env.NODE_ENV,
      version: '1.0.0',
      database: 'unverified', // Open/unverified pending cPanel host inspection
      storage: storageOk ? 'operational' : 'degraded',
    };
  }
}

export const healthService = new HealthService();
