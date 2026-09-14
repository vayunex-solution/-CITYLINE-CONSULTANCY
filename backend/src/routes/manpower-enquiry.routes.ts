/**
 * CITYLINE CONSULTANCY — Public Manpower Enquiry Routes
 * Mounts endpoints for public corporate employer manpower requisitions.
 */

import { Router } from 'express';
import { manpowerRateLimitMiddleware } from '../middleware/manpower-rate-limit.middleware';
import { manpowerEnquiryController } from '../controllers/manpower-enquiry.controller';

const router = Router();

// POST /api/v1/manpower-enquiries
router.post('/', manpowerRateLimitMiddleware, (req, res, next) => {
  void manpowerEnquiryController.submitEnquiry(req, res, next);
});

export default router;
