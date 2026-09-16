"use strict";
/**
 * CITYLINE CONSULTANCY — Health Controller
 * Delivers health response payload via standard ApiResponse envelope.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = exports.HealthController = void 0;
const health_service_1 = require("../services/health.service");
const api_response_1 = require("../utils/api-response");
class HealthController {
    check(req, res) {
        const healthData = health_service_1.healthService.getHealthStatus();
        (0, api_response_1.sendSuccess)(res, healthData, 200, req.requestId);
    }
}
exports.HealthController = HealthController;
exports.healthController = new HealthController();
