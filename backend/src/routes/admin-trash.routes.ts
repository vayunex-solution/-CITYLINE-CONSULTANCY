/**
 * CITYLINE CONSULTANCY — Administrative Trash Routes
 * Mounts endpoints for listing, restoring, and permanently purging soft-deleted items.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { adminTrashController } from '../controllers/admin-trash.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

router.get('/', (req, res, next) => {
  void adminTrashController.listTrash(req, res, next);
});

router.post('/:type/:id/restore', (req, res, next) => {
  void adminTrashController.restoreItem(req, res, next);
});

router.delete('/:type/:id', requireRole('super_admin'), (req, res, next) => {
  void adminTrashController.deleteItem(req, res, next);
});

router.post('/purge', requireRole('super_admin'), (req, res, next) => {
  void adminTrashController.purgeTrash(req, res, next);
});

export default router;
