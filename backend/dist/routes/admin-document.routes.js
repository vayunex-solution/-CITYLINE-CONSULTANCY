"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Document Routes
 * Mounts endpoints for previewing and downloading customer-submitted documents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_document_controller_1 = require("../controllers/admin-document.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.get('/:id/preview', (req, res, next) => {
    void admin_document_controller_1.adminDocumentController.previewDocument(req, res, next);
});
router.get('/:id/download', (req, res, next) => {
    void admin_document_controller_1.adminDocumentController.downloadDocument(req, res, next);
});
exports.default = router;
