"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_config_1 = require("./config/env.config");
const request_id_middleware_1 = require("./middleware/request-id.middleware");
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
const not_found_middleware_1 = require("./middleware/not-found.middleware");
const routes_1 = __importDefault(require("./routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Deliberate Proxy Trust Policy:
    // Set to false by default to prevent clients from spoofing X-Forwarded-For headers.
    // Production reverse proxy topology remains UNVERIFIED until Phase 17 deployment.
    app.set('trust proxy', false);
    // 1. Security HTTP Headers (Helmet)
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: env_config_1.env.NODE_ENV === 'production',
        crossOriginEmbedderPolicy: env_config_1.env.NODE_ENV === 'production',
        frameguard: { action: 'deny' },
        hsts: env_config_1.env.NODE_ENV === 'production'
            ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            }
            : false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        noSniff: true,
    }));
    // 2. Controlled CORS Foundation
    const allowedOrigins = env_config_1.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) {
                return callback(null, true);
            }
            // Never allow wildcard with credentials in production
            if (allowedOrigins.includes('*')) {
                if (env_config_1.env.NODE_ENV === 'production') {
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
    app.use((0, cors_1.default)(corsOptions));
    // 3. Request Body Parsing with Strict 100kb Size Limits & Cookie Parsing
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '100kb' }));
    app.use((0, cookie_parser_1.default)());
    // 4. Correlation ID Tracking (X-Request-ID)
    app.use(request_id_middleware_1.requestIdMiddleware);
    // 5. Structured HTTP Request Logging
    app.use(request_logger_middleware_1.requestLoggerMiddleware);
    // 6. Direct Root Health Check (for cPanel Passenger / Uptime Monitors)
    app.use('/health', health_routes_1.default);
    // 7. Versioned API Routes (/api/v1)
    app.use(env_config_1.env.API_PREFIX, routes_1.default);
    // 8. Centralized 404 Route Not Found Handler
    app.use(not_found_middleware_1.notFoundMiddleware);
    // 9. Centralized Error Handling Middleware
    app.use(error_handler_middleware_1.errorHandlerMiddleware);
    return app;
}
exports.app = createApp();
