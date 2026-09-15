/**
 * CITYLINE CONSULTANCY — Administrative Notification Queue Routes
 * Mounts endpoints for monitoring and retrying outbox notifications.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { adminDashboardController } from '../controllers/admin-dashboard.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

router.get('/', (req, res, next) => {
  void adminDashboardController.listNotifications(req, res, next);
});

router.post('/:id/retry', (req, res, next) => {
  void adminDashboardController.retryNotification(req, res, next);
});

export default router;
