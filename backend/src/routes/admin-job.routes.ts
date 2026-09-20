/**
 * CITYLINE CONSULTANCY — Administrative Recruitment Management Routes
 * Mounts endpoints for managing job vacancies and reviewing candidate applications.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { adminJobController } from '../controllers/admin-job.controller';

const router = Router();

// Apply administrative authentication, RBAC, and Double-Submit CSRF guards to all routes
router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

// Vacancy Management
router.get('/jobs', (req, res, next) => {
  void adminJobController.listJobs(req, res, next);
});

router.post('/jobs', (req, res, next) => {
  void adminJobController.createJob(req, res, next);
});

router.get('/jobs/:id', (req, res, next) => {
  void adminJobController.getJob(req, res, next);
});

router.put('/jobs/:id', (req, res, next) => {
  void adminJobController.updateJob(req, res, next);
});

// Permanent deletion strictly restricted to super_admin
router.delete('/jobs/:id', requireRole('super_admin'), (req, res, next) => {
  void adminJobController.deleteJob(req, res, next);
});

// Candidate Application Review
router.get('/applications', (req, res, next) => {
  void adminJobController.listApplications(req, res, next);
});

router.get('/applications/:id', (req, res, next) => {
  void adminJobController.getApplication(req, res, next);
});

router.patch('/applications/:id/status', (req, res, next) => {
  void adminJobController.updateApplicationStatus(req, res, next);
});

export default router;
