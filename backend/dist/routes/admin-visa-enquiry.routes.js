"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Visa Enquiry Routes
 * Mounts endpoints for reviewing and managing visa applications and document metadata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_dashboard_controller_1 = require("../controllers/admin-dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
router.get('/', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.listVisaEnquiries(req, res, next);
});
router.get('/:id', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.getVisaEnquiry(req, res, next);
});
router.patch('/:id/status', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.updateVisaEnquiryStatus(req, res, next);
});
exports.default = router;
