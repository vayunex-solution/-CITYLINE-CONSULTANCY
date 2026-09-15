/**
 * CITYLINE CONSULTANCY — Administrative Audit Log Routes
 * Mounts endpoints for querying immutable operational and security audit records.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { adminDashboardController } from '../controllers/admin-dashboard.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

router.get('/', (req, res, next) => {
  void adminDashboardController.listAuditLogs(req, res, next);
});

export default router;
