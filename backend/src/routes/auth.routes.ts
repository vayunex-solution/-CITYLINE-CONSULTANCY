/**
 * CITYLINE CONSULTANCY — Administrative Authentication Routes
 * Mounts login, logout, and me endpoints with rate limiting, CSRF, and RBAC guards.
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/auth-rate-limit.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { requireAuthenticatedAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public authentication endpoint (rate-limited, establishes session & CSRF cookie)
router.post('/login', authRateLimiter, (req, res, next) => {
  void authController.login(req, res, next);
});

// Authenticated administrative endpoints
router.post('/logout', requireAuthenticatedAdmin, csrfProtection, (req, res, next) => {
  void authController.logout(req, res, next);
});

router.get('/me', requireAuthenticatedAdmin, (req, res, next) => {
  void authController.me(req, res, next);
});

export default router;
