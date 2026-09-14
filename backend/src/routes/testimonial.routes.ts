/**
 * CITYLINE CONSULTANCY — Public Testimonials Routes
 * Serves verified published client testimonials.
 */

import { Router } from 'express';
import { testimonialController } from '../controllers/testimonial.controller';

const router = Router();

// GET /api/v1/testimonials
router.get('/', (req, res, next) => {
  void testimonialController.getPublishedTestimonials(req, res, next);
});

export default router;
