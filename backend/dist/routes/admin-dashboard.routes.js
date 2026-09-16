"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Dashboard Routes
 * Mounts dashboard statistical metrics endpoint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_dashboard_controller_1 = require("../controllers/admin-dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.get('/stats', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.getDashboardStats(req, res, next);
});
exports.default = router;
