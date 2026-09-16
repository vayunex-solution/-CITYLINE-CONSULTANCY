"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Notification Queue Routes
 * Mounts endpoints for monitoring and retrying outbox notifications.
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
    void admin_dashboard_controller_1.adminDashboardController.listNotifications(req, res, next);
});
router.post('/:id/retry', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.retryNotification(req, res, next);
});
exports.default = router;
