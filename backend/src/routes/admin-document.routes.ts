/**
 * CITYLINE CONSULTANCY — Administrative Document Routes
 * Mounts endpoints for previewing and downloading customer-submitted documents.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { adminDocumentController } from '../controllers/admin-document.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));

router.get('/:id/preview', (req, res, next) => {
  void adminDocumentController.previewDocument(req, res, next);
});

router.get('/:id/download', (req, res, next) => {
  void adminDocumentController.downloadDocument(req, res, next);
});

export default router;
