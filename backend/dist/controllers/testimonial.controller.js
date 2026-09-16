"use strict";
/**
 * CITYLINE CONSULTANCY — Public Testimonials Controller
 * Serves verified published testimonials for public website consumption.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialController = exports.TestimonialController = void 0;
const testimonial_service_1 = require("../services/testimonial.service");
const api_response_1 = require("../utils/api-response");
class TestimonialController {
    service;
    constructor(service = testimonial_service_1.testimonialService) {
        this.service = service;
    }
    getPublishedTestimonials = async (req, res, next) => {
        try {
            const testimonials = await this.service.getPublishedTestimonials();
            (0, api_response_1.sendSuccess)(res, testimonials, 200, req.id);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.TestimonialController = TestimonialController;
exports.testimonialController = new TestimonialController();
