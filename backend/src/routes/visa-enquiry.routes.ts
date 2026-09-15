/**
 * CITYLINE CONSULTANCY — Visa Enquiry Public Routes
 * Mounts POST /api/v1/visa-enquiries with rate limiting and multipart upload security.
 */

import { Router } from 'express';
import { visaEnquiryController } from '../controllers/visa-enquiry.controller';
import { visaEnquiryRateLimiter } from '../middleware/visa-rate-limit.middleware';
import { visaEnquiryUploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// GET /api/v1/visa-enquiries/services
router.get('/services', (req, res, next) => {
  void visaEnquiryController.listServices(req, res, next);
});

// POST /api/v1/visa-enquiries
router.post(
  '/',
  visaEnquiryRateLimiter,
  visaEnquiryUploadMiddleware,
  (req, res, next) => {
    void visaEnquiryController.submitEnquiry(req, res, next);
  }
);

export default router;
