"use strict";
/**
 * CITYLINE CONSULTANCY — Public Manpower Enquiry Routes
 * Mounts endpoints for public corporate employer manpower requisitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manpower_rate_limit_middleware_1 = require("../middleware/manpower-rate-limit.middleware");
const manpower_enquiry_controller_1 = require("../controllers/manpower-enquiry.controller");
const router = (0, express_1.Router)();
// POST /api/v1/manpower-enquiries
router.post('/', manpower_rate_limit_middleware_1.manpowerRateLimitMiddleware, (req, res, next) => {
    void manpower_enquiry_controller_1.manpowerEnquiryController.submitEnquiry(req, res, next);
});
exports.default = router;
