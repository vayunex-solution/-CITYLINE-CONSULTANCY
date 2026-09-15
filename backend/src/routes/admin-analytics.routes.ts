/**
 * CITYLINE CONSULTANCY — Administrative Analytics Routes
 * Exposes protected aggregate analytics endpoints guarded by authentication and RBAC.
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin analytics routes
router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

// GET /api/v1/admin/analytics/overview
router.get('/overview', analyticsController.getOverview);

export default router;
