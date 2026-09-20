/**
 * CITYLINE CONSULTANCY — Administrative Settings Routes
 * Mounts endpoints for managing dynamic system configuration,
 * notification recipient emails, and live delivery testing.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { adminSettingController } from '../controllers/admin-setting.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

router.get('/', (req, res, next) => {
  void adminSettingController.getSettings(req, res, next);
});

router.put('/', requireRole('super_admin'), (req, res, next) => {
  void adminSettingController.updateSettings(req, res, next);
});

router.post('/test-email', requireRole('super_admin'), (req, res, next) => {
  void adminSettingController.sendTestEmail(req, res, next);
});

export default router;
