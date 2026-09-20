"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Trash Routes
 * Mounts endpoints for listing, restoring, and permanently purging soft-deleted items.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_trash_controller_1 = require("../controllers/admin-trash.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
router.get('/', (req, res, next) => {
    void admin_trash_controller_1.adminTrashController.listTrash(req, res, next);
});
router.post('/:type/:id/restore', (req, res, next) => {
    void admin_trash_controller_1.adminTrashController.restoreItem(req, res, next);
});
router.delete('/:type/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_trash_controller_1.adminTrashController.deleteItem(req, res, next);
});
router.post('/purge', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_trash_controller_1.adminTrashController.purgeTrash(req, res, next);
});
exports.default = router;
