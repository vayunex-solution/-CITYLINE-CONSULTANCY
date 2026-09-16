"use strict";
/**
 * CITYLINE CONSULTANCY — Health Check Service
 * Returns minimal operational health status without leaking internal subsystem details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = exports.HealthService = void 0;
class HealthService {
    getHealthStatus() {
        return {
            status: 'ok',
        };
    }
}
exports.HealthService = HealthService;
exports.healthService = new HealthService();
