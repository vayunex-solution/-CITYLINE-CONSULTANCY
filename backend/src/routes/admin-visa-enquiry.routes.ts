/**
 * CITYLINE CONSULTANCY — Administrative Visa Enquiry Routes
 * Mounts endpoints for reviewing and managing visa applications and document metadata.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { adminDashboardController } from '../controllers/admin-dashboard.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

router.get('/', (req, res, next) => {
  void adminDashboardController.listVisaEnquiries(req, res, next);
});

router.get('/:id', (req, res, next) => {
  void adminDashboardController.getVisaEnquiry(req, res, next);
});

router.patch('/:id/status', (req, res, next) => {
  void adminDashboardController.updateVisaEnquiryStatus(req, res, next);
});

export default router;
