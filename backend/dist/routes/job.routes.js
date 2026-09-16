"use strict";
/**
 * CITYLINE CONSULTANCY — Public Jobs & Recruitment Routes
 * Mounts public endpoints for job listings, categories, details, and candidate applications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
const job_rate_limit_middleware_1 = require("../middleware/job-rate-limit.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/jobs - Browse & search published vacancies
router.get('/', (req, res, next) => {
    void job_controller_1.jobController.getJobs(req, res, next);
});
// GET /api/v1/jobs/categories - List active job categories with vacancy counts
router.get('/categories', (req, res, next) => {
    void job_controller_1.jobController.getCategories(req, res, next);
});
// GET /api/v1/jobs/:slug - Retrieve single published job vacancy details
router.get('/:slug', (req, res, next) => {
    void job_controller_1.jobController.getJobBySlug(req, res, next);
});
// POST /api/v1/jobs/:slug/apply - Submit candidate application with CV upload
router.post('/:slug/apply', job_rate_limit_middleware_1.jobApplicationRateLimiter, upload_middleware_1.jobApplicationUploadMiddleware, (req, res, next) => {
    void job_controller_1.jobController.submitApplication(req, res, next);
});
exports.default = router;
