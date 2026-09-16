"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Authentication Routes
 * Mounts login, logout, and me endpoints with rate limiting, CSRF, and RBAC guards.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_rate_limit_middleware_1 = require("../middleware/auth-rate-limit.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public authentication endpoint (rate-limited, establishes session & CSRF cookie)
router.post('/login', auth_rate_limit_middleware_1.authRateLimiter, (req, res, next) => {
    void auth_controller_1.authController.login(req, res, next);
});
// Authenticated administrative endpoints
router.post('/logout', auth_middleware_1.requireAuthenticatedAdmin, csrf_middleware_1.csrfProtection, (req, res, next) => {
    void auth_controller_1.authController.logout(req, res, next);
});
router.get('/me', auth_middleware_1.requireAuthenticatedAdmin, (req, res, next) => {
    void auth_controller_1.authController.me(req, res, next);
});
exports.default = router;
