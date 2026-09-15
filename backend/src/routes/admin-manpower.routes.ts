/**
 * CITYLINE CONSULTANCY — Administrative Manpower Management Routes
 * Mounts endpoints for managing corporate employer manpower requisitions.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { adminManpowerController } from '../controllers/admin-manpower.controller';

const router = Router();

// Apply administrative authentication, RBAC, and CSRF guards to all routes
router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

// GET /api/v1/admin/manpower-enquiries
router.get('/', (req, res, next) => {
  void adminManpowerController.listEnquiries(req, res, next);
});

// GET /api/v1/admin/manpower-enquiries/:id
router.get('/:id', (req, res, next) => {
  void adminManpowerController.getEnquiry(req, res, next);
});

// PATCH /api/v1/admin/manpower-enquiries/:id/status
router.patch('/:id/status', (req, res, next) => {
  void adminManpowerController.updateStatus(req, res, next);
});

// PATCH /api/v1/admin/manpower-enquiries/:id
router.patch('/:id', (req, res, next) => {
  void adminManpowerController.updateEnquiry(req, res, next);
});

export default router;
