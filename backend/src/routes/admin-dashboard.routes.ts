/**
 * CITYLINE CONSULTANCY — Admin Dashboard Routes
 * Mounts dashboard statistical metrics endpoint.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { adminDashboardController } from '../controllers/admin-dashboard.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

router.get('/stats', (req, res, next) => {
  void adminDashboardController.getDashboardStats(req, res, next);
});

export default router;
