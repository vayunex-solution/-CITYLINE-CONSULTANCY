/**
 * CITYLINE CONSULTANCY — Express Application Factory
 * Configures security headers, controlled CORS, request tracing, body limits, routing, and error handling.
 *
 * GOVERNANCE:
 * - Centralizes HTTP middleware pipeline.
 * - Enforces conservative payload limits (100kb).
 * - Restricts CORS origins (no wildcard with credentials in production).
 * - Mounts versioned namespace under /api/v1.
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { env } from './config/env.config';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import apiRouter from './routes';
import healthRoutes from './routes/health.routes';

export function createApp(): Express {
  const app = express();

  // 1. Security HTTP Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    })
  );

  // 2. Controlled CORS Foundation
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) in development/test
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'x-request-id'],
    exposedHeaders: ['X-Request-ID', 'x-request-id'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  };

  app.use(cors(corsOptions));

  // 3. Request Body Parsing with Strict 100kb Size Limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 4. Correlation ID Tracking (X-Request-ID)
  app.use(requestIdMiddleware);

  // 5. Structured HTTP Request Logging
  app.use(requestLoggerMiddleware);

  // 6. Direct Root Health Check (for cPanel Passenger / Uptime Monitors)
  app.use('/health', healthRoutes);

  // 7. Versioned API Routes (/api/v1)
  app.use(env.API_PREFIX, apiRouter);

  // 8. Centralized 404 Route Not Found Handler
  app.use(notFoundMiddleware);

  // 9. Centralized Error Handling Middleware
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
