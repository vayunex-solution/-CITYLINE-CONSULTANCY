/**
 * CITYLINE CONSULTANCY — Administrative Master Data Routes
 * Mounts endpoints for managing reference tables: categories, locations, visa services, industries.
 *
 * GOVERNANCE:
 * - Requires administrative session.
 * - RBAC: super_admin & admin_operator.
 * - Enforces CSRF token validation on state-modifying verbs.
 */

import { Router } from 'express';
import { requireAuthenticatedAdmin, requireRole } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { masterDataController } from '../controllers/master-data.controller';

const router = Router();

router.use(requireAuthenticatedAdmin);
router.use(requireRole('super_admin', 'admin_operator'));
router.use(csrfProtection);

// ==========================================
// 1. Job Categories
// ==========================================
router.get('/categories', (req, res, next) => {
  void masterDataController.listCategories(req, res, next);
});

router.post('/categories', (req, res, next) => {
  void masterDataController.createCategory(req, res, next);
});

router.put('/categories/:id', (req, res, next) => {
  void masterDataController.updateCategory(req, res, next);
});

router.patch('/categories/:id/toggle', (req, res, next) => {
  void masterDataController.toggleCategoryActive(req, res, next);
});

router.delete('/categories/:id', requireRole('super_admin'), (req, res, next) => {
  void masterDataController.deleteCategory(req, res, next);
});

// ==========================================
// 2. Job Locations
// ==========================================
router.get('/locations', (req, res, next) => {
  void masterDataController.listLocations(req, res, next);
});

router.post('/locations', (req, res, next) => {
  void masterDataController.createLocation(req, res, next);
});

router.put('/locations/:id', (req, res, next) => {
  void masterDataController.updateLocation(req, res, next);
});

router.patch('/locations/:id/toggle', (req, res, next) => {
  void masterDataController.toggleLocationActive(req, res, next);
});

router.delete('/locations/:id', requireRole('super_admin'), (req, res, next) => {
  void masterDataController.deleteLocation(req, res, next);
});

// ==========================================
// 3. Visa Services
// ==========================================
router.get('/visa-services', (req, res, next) => {
  void masterDataController.listVisaServices(req, res, next);
});

router.post('/visa-services', (req, res, next) => {
  void masterDataController.createVisaService(req, res, next);
});

router.put('/visa-services/:id', (req, res, next) => {
  void masterDataController.updateVisaService(req, res, next);
});

router.patch('/visa-services/:id/toggle', (req, res, next) => {
  void masterDataController.toggleVisaServiceActive(req, res, next);
});

router.delete('/visa-services/:id', requireRole('super_admin'), (req, res, next) => {
  void masterDataController.deleteVisaService(req, res, next);
});

// ==========================================
// 4. Industry Sectors
// ==========================================
router.get('/industries', (req, res, next) => {
  void masterDataController.listIndustries(req, res, next);
});

router.post('/industries', (req, res, next) => {
  void masterDataController.createIndustry(req, res, next);
});

router.put('/industries/:id', (req, res, next) => {
  void masterDataController.updateIndustry(req, res, next);
});

router.patch('/industries/:id/toggle', (req, res, next) => {
  void masterDataController.toggleIndustryActive(req, res, next);
});

router.delete('/industries/:id', requireRole('super_admin'), (req, res, next) => {
  void masterDataController.deleteIndustry(req, res, next);
});

export default router;
