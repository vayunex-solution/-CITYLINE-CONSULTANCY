"use strict";
/**
 * CITYLINE CONSULTANCY — Public Testimonials Routes
 * Serves verified published client testimonials.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonial_controller_1 = require("../controllers/testimonial.controller");
const router = (0, express_1.Router)();
// GET /api/v1/testimonials
router.get('/', (req, res, next) => {
    void testimonial_controller_1.testimonialController.getPublishedTestimonials(req, res, next);
});
exports.default = router;
