/**
 * CITYLINE CONSULTANCY — Business Setup Enquiry Public Routes
 * Mounts POST /api/v1/business-enquiries with rate limiting.
 */

import { Router } from 'express';
import { businessEnquiryController } from '../controllers/business-enquiry.controller';
import { visaEnquiryRateLimiter } from '../middleware/visa-rate-limit.middleware';

const router = Router();

// POST /api/v1/business-enquiries
router.post('/', visaEnquiryRateLimiter, (req, res, next) => {
  void businessEnquiryController.submitEnquiry(req, res, next);
});

export default router;
