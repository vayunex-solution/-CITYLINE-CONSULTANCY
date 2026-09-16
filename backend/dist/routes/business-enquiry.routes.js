"use strict";
/**
 * CITYLINE CONSULTANCY — Business Setup Enquiry Public Routes
 * Mounts POST /api/v1/business-enquiries with rate limiting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_enquiry_controller_1 = require("../controllers/business-enquiry.controller");
const visa_rate_limit_middleware_1 = require("../middleware/visa-rate-limit.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// POST /api/v1/business-enquiries (supports both JSON and multipart file uploads)
router.post('/', visa_rate_limit_middleware_1.visaEnquiryRateLimiter, upload_middleware_1.businessEnquiryUploadMiddleware, (req, res, next) => {
    void business_enquiry_controller_1.businessEnquiryController.submitEnquiry(req, res, next);
});
exports.default = router;
