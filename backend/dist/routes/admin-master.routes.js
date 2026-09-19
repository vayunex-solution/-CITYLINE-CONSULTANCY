"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Master Data Routes
 * Mounts endpoints for managing reference tables: categories, locations, visa services, industries.
 *
 * GOVERNANCE:
 * - Requires administrative session.
 * - RBAC: super_admin & admin_operator.
 * - Enforces CSRF token validation on state-modifying verbs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const csrf_middleware_1 = require("../middleware/csrf.middleware");
const master_data_controller_1 = require("../controllers/master-data.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuthenticatedAdmin);
router.use((0, auth_middleware_1.requireRole)('super_admin', 'admin_operator'));
router.use(csrf_middleware_1.csrfProtection);
// ==========================================
// 1. Job Categories
// ==========================================
router.get('/categories', (req, res, next) => {
    void master_data_controller_1.masterDataController.listCategories(req, res, next);
});
router.post('/categories', (req, res, next) => {
    void master_data_controller_1.masterDataController.createCategory(req, res, next);
});
router.put('/categories/:id', (req, res, next) => {
    void master_data_controller_1.masterDataController.updateCategory(req, res, next);
});
router.patch('/categories/:id/toggle', (req, res, next) => {
    void master_data_controller_1.masterDataController.toggleCategoryActive(req, res, next);
});
router.delete('/categories/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void master_data_controller_1.masterDataController.deleteCategory(req, res, next);
});
// ==========================================
// 2. Job Locations
// ==========================================
router.get('/locations', (req, res, next) => {
    void master_data_controller_1.masterDataController.listLocations(req, res, next);
});
router.post('/locations', (req, res, next) => {
    void master_data_controller_1.masterDataController.createLocation(req, res, next);
});
router.put('/locations/:id', (req, res, next) => {
    void master_data_controller_1.masterDataController.updateLocation(req, res, next);
});
router.patch('/locations/:id/toggle', (req, res, next) => {
    void master_data_controller_1.masterDataController.toggleLocationActive(req, res, next);
});
router.delete('/locations/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void master_data_controller_1.masterDataController.deleteLocation(req, res, next);
});
// ==========================================
// 3. Visa Services
// ==========================================
router.get('/visa-services', (req, res, next) => {
    void master_data_controller_1.masterDataController.listVisaServices(req, res, next);
});
router.post('/visa-services', (req, res, next) => {
    void master_data_controller_1.masterDataController.createVisaService(req, res, next);
});
router.put('/visa-services/:id', (req, res, next) => {
    void master_data_controller_1.masterDataController.updateVisaService(req, res, next);
});
router.patch('/visa-services/:id/toggle', (req, res, next) => {
    void master_data_controller_1.masterDataController.toggleVisaServiceActive(req, res, next);
});
router.delete('/visa-services/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void master_data_controller_1.masterDataController.deleteVisaService(req, res, next);
});
// ==========================================
// 4. Industry Sectors
// ==========================================
router.get('/industries', (req, res, next) => {
    void master_data_controller_1.masterDataController.listIndustries(req, res, next);
});
router.post('/industries', (req, res, next) => {
    void master_data_controller_1.masterDataController.createIndustry(req, res, next);
});
router.put('/industries/:id', (req, res, next) => {
    void master_data_controller_1.masterDataController.updateIndustry(req, res, next);
});
router.patch('/industries/:id/toggle', (req, res, next) => {
    void master_data_controller_1.masterDataController.toggleIndustryActive(req, res, next);
});
router.delete('/industries/:id', (0, auth_middleware_1.requireRole)('super_admin'), (req, res, next) => {
    void master_data_controller_1.masterDataController.deleteIndustry(req, res, next);
});
exports.default = router;
