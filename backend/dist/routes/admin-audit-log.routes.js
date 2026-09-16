"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Audit Log Routes
 * Mounts endpoints for querying immutable operational and security audit records.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_dashboard_controller_1 = require("../controllers/admin-dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.get('/', (req, res, next) => {
    void admin_dashboard_controller_1.adminDashboardController.listAuditLogs(req, res, next);
});
exports.default = router;
