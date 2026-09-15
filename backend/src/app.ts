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
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import apiRouter from './routes';
import healthRoutes from './routes/health.routes';

export function createApp(): Express {
  const app = express();

  // Deliberate Proxy Trust Policy:
  // Set to false by default to prevent clients from spoofing X-Forwarded-For headers.
  // Production reverse proxy topology remains UNVERIFIED until Phase 17 deployment.
  app.set('trust proxy', false);

  // 1. Security HTTP Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
      frameguard: { action: 'deny' },
      hsts:
        env.NODE_ENV === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
    })
  );

  // 2. Controlled CORS Foundation
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      // Never allow wildcard with credentials in production
      if (allowedOrigins.includes('*')) {
        if (env.NODE_ENV === 'production') {
          return callback(null, false);
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'x-request-id', 'X-CSRF-Token', 'x-csrf-token'],
    exposedHeaders: ['X-Request-ID', 'x-request-id', 'X-CSRF-Token', 'x-csrf-token'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  };

  app.use(cors(corsOptions));

  // 3. Request Body Parsing with Strict 100kb Size Limits & Cookie Parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

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
