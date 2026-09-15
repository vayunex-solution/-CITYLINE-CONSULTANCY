/**
 * CITYLINE CONSULTANCY — Administrative Testimonials Routes
 * Mounts endpoints for managing client testimonials.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { adminTestimonialController } from '../controllers/admin-testimonial.controller';

const router = Router();

// Require administrative authentication, role check, and CSRF protection
router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

// PUT /api/v1/admin/testimonials/reorder
router.put('/reorder', (req, res, next) => {
  void adminTestimonialController.reorderTestimonials(req, res, next);
});

// GET /api/v1/admin/testimonials
router.get('/', (req, res, next) => {
  void adminTestimonialController.listTestimonials(req, res, next);
});

// GET /api/v1/admin/testimonials/:id
router.get('/:id', (req, res, next) => {
  void adminTestimonialController.getTestimonial(req, res, next);
});

// POST /api/v1/admin/testimonials
router.post('/', (req, res, next) => {
  void adminTestimonialController.createTestimonial(req, res, next);
});

// PATCH /api/v1/admin/testimonials/:id
router.patch('/:id', (req, res, next) => {
  void adminTestimonialController.updateTestimonial(req, res, next);
});

// DELETE /api/v1/admin/testimonials/:id - strictly restricted to super_admin
router.delete('/:id', requireRole('super_admin'), (req, res, next) => {
  void adminTestimonialController.deleteTestimonial(req, res, next);
});

export default router;
