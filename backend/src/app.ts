/**
 * CITYLINE CONSULTANCY — Express Application Factory
 * Configures security headers, CORS, request tracing, routing, and error handling.
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.config';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import apiRouter from './routes';
import healthRoutes from './routes/health.routes';
import { AppError } from './utils/app-error';

export function createApp(): Express {
  const app = express();

  // Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      exposedHeaders: ['x-request-id'],
      credentials: true,
    })
  );

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Correlation ID tracking
  app.use(requestIdMiddleware);

  // HTTP Request Logging
  app.use(requestLoggerMiddleware);

  // Direct root health check for uptime monitors and cPanel Passenger
  app.use('/health', healthRoutes);

  // Versioned API routes
  app.use(env.API_PREFIX, apiRouter);

  // 404 Route Not Found Handler
  app.use((req, _res, next) => {
    next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
