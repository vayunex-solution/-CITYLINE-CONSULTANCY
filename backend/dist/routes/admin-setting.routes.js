"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Settings Routes
 * Mounts endpoints for managing dynamic system configuration,
 * notification recipient emails, and live delivery testing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_setting_controller_1 = require("../controllers/admin-setting.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
router.get('/', (req, res, next) => {
    void admin_setting_controller_1.adminSettingController.getSettings(req, res, next);
});
router.put('/', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_setting_controller_1.adminSettingController.updateSettings(req, res, next);
});
router.post('/test-email', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_setting_controller_1.adminSettingController.sendTestEmail(req, res, next);
});
exports.default = router;
