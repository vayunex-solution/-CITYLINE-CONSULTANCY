"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Manpower Management Routes
 * Mounts endpoints for managing corporate employer manpower requisitions.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_manpower_controller_1 = require("../controllers/admin-manpower.controller");
const router = (0, express_1.Router)();
// Apply administrative authentication, RBAC, and CSRF guards to all routes
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
// GET /api/v1/admin/manpower-enquiries
router.get('/', (req, res, next) => {
    void admin_manpower_controller_1.adminManpowerController.listEnquiries(req, res, next);
});
// GET /api/v1/admin/manpower-enquiries/:id
router.get('/:id', (req, res, next) => {
    void admin_manpower_controller_1.adminManpowerController.getEnquiry(req, res, next);
});
// PATCH /api/v1/admin/manpower-enquiries/:id/status
router.patch('/:id/status', (req, res, next) => {
    void admin_manpower_controller_1.adminManpowerController.updateStatus(req, res, next);
});
// PATCH /api/v1/admin/manpower-enquiries/:id
router.patch('/:id', (req, res, next) => {
    void admin_manpower_controller_1.adminManpowerController.updateEnquiry(req, res, next);
});
exports.default = router;
