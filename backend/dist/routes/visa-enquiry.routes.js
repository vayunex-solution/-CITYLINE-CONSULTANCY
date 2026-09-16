"use strict";
/**
 * CITYLINE CONSULTANCY — Visa Enquiry Public Routes
 * Mounts POST /api/v1/visa-enquiries with rate limiting and multipart upload security.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visa_enquiry_controller_1 = require("../controllers/visa-enquiry.controller");
const visa_rate_limit_middleware_1 = require("../middleware/visa-rate-limit.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/visa-enquiries/services
router.get('/services', (req, res, next) => {
    void visa_enquiry_controller_1.visaEnquiryController.listServices(req, res, next);
});
// POST /api/v1/visa-enquiries
router.post('/', visa_rate_limit_middleware_1.visaEnquiryRateLimiter, upload_middleware_1.visaEnquiryUploadMiddleware, (req, res, next) => {
    void visa_enquiry_controller_1.visaEnquiryController.submitEnquiry(req, res, next);
});
exports.default = router;
