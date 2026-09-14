/**
 * CITYLINE CONSULTANCY — Public Jobs & Recruitment Routes
 * Mounts public endpoints for job listings, categories, details, and candidate applications.
 */

import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { jobApplicationRateLimiter } from '../middleware/job-rate-limit.middleware';
import { jobApplicationUploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// GET /api/v1/jobs - Browse & search published vacancies
router.get('/', (req, res, next) => {
  void jobController.getJobs(req, res, next);
});

// GET /api/v1/jobs/categories - List active job categories with vacancy counts
router.get('/categories', (req, res, next) => {
  void jobController.getCategories(req, res, next);
});

// GET /api/v1/jobs/:slug - Retrieve single published job vacancy details
router.get('/:slug', (req, res, next) => {
  void jobController.getJobBySlug(req, res, next);
});

// POST /api/v1/jobs/:slug/apply - Submit candidate application with CV upload
router.post(
  '/:slug/apply',
  jobApplicationRateLimiter,
  jobApplicationUploadMiddleware,
  (req, res, next) => {
    void jobController.submitApplication(req, res, next);
  }
);

export default router;
