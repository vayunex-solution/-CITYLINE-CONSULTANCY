"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Recruitment Management Routes
 * Mounts endpoints for managing job vacancies and reviewing candidate applications.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_job_controller_1 = require("../controllers/admin-job.controller");
const router = (0, express_1.Router)();
// Apply administrative authentication, RBAC, and Double-Submit CSRF guards to all routes
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
// Vacancy Management
router.get('/jobs', (req, res, next) => {
    void admin_job_controller_1.adminJobController.listJobs(req, res, next);
});
router.post('/jobs', (req, res, next) => {
    void admin_job_controller_1.adminJobController.createJob(req, res, next);
});
router.get('/jobs/:id', (req, res, next) => {
    void admin_job_controller_1.adminJobController.getJob(req, res, next);
});
router.put('/jobs/:id', (req, res, next) => {
    void admin_job_controller_1.adminJobController.updateJob(req, res, next);
});
// Permanent deletion strictly restricted to super_admin
router.delete('/jobs/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_job_controller_1.adminJobController.deleteJob(req, res, next);
});
// Candidate Application Review
router.get('/applications', (req, res, next) => {
    void admin_job_controller_1.adminJobController.listApplications(req, res, next);
});
router.get('/applications/:id', (req, res, next) => {
    void admin_job_controller_1.adminJobController.getApplication(req, res, next);
});
router.patch('/applications/:id/status', (req, res, next) => {
    void admin_job_controller_1.adminJobController.updateApplicationStatus(req, res, next);
});
router.delete('/applications/:id', (req, res, next) => {
    void admin_job_controller_1.adminJobController.moveApplicationToTrash(req, res, next);
});
exports.default = router;
