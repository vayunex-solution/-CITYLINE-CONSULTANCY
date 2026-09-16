"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Testimonials Routes
 * Mounts endpoints for managing client testimonials.
 *
 * GOVERNANCE:
 * - Strictly requires administrative authentication.
 * - Enforces RBAC permissions: 'super_admin' and 'admin_operator'.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const admin_testimonial_controller_1 = require("../controllers/admin-testimonial.controller");
const router = (0, express_1.Router)();
// Require administrative authentication, role check, and CSRF protection
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
// PUT /api/v1/admin/testimonials/reorder
router.put('/reorder', (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.reorderTestimonials(req, res, next);
});
// GET /api/v1/admin/testimonials
router.get('/', (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.listTestimonials(req, res, next);
});
// GET /api/v1/admin/testimonials/:id
router.get('/:id', (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.getTestimonial(req, res, next);
});
// POST /api/v1/admin/testimonials
router.post('/', (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.createTestimonial(req, res, next);
});
// PATCH /api/v1/admin/testimonials/:id
router.patch('/:id', (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.updateTestimonial(req, res, next);
});
// DELETE /api/v1/admin/testimonials/:id - strictly restricted to super_admin
router.delete('/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void admin_testimonial_controller_1.adminTestimonialController.deleteTestimonial(req, res, next);
});
exports.default = router;
