"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Analytics Routes
 * Exposes protected aggregate analytics endpoints guarded by authentication and RBAC.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protect all admin analytics routes
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
// GET /api/v1/admin/analytics/overview
router.get('/overview', analytics_controller_1.analyticsController.getOverview);
exports.default = router;
