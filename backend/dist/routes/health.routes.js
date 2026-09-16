"use strict";
/**
 * CITYLINE CONSULTANCY — Health Routes
 * Exposes health monitoring endpoint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
router.get('/', (req, res) => health_controller_1.healthController.check(req, res));
exports.default = router;
