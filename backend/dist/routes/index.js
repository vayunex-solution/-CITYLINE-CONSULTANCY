"use strict";
/**
 * CITYLINE CONSULTANCY — API Routes Aggregator
 * Mounts all versioned sub-routers under the API prefix (/api/v1).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const visa_enquiry_routes_1 = __importDefault(require("./visa-enquiry.routes"));
const job_routes_1 = __importDefault(require("./job.routes"));
const admin_job_routes_1 = __importDefault(require("./admin-job.routes"));
const manpower_enquiry_routes_1 = __importDefault(require("./manpower-enquiry.routes"));
const admin_manpower_routes_1 = __importDefault(require("./admin-manpower.routes"));
const business_enquiry_routes_1 = __importDefault(require("./business-enquiry.routes"));
const testimonial_routes_1 = __importDefault(require("./testimonial.routes"));
const admin_testimonial_routes_1 = __importDefault(require("./admin-testimonial.routes"));
const admin_dashboard_routes_1 = __importDefault(require("./admin-dashboard.routes"));
const admin_visa_enquiry_routes_1 = __importDefault(require("./admin-visa-enquiry.routes"));
const admin_notification_routes_1 = __importDefault(require("./admin-notification.routes"));
const admin_audit_log_routes_1 = __importDefault(require("./admin-audit-log.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const admin_analytics_routes_1 = __importDefault(require("./admin-analytics.routes"));
const apiRouter = (0, express_1.Router)();
// Health monitoring endpoint under API prefix: /api/v1/health
apiRouter.use('/health', health_routes_1.default);
// Phase 4: Admin Authentication & Security Foundation
apiRouter.use('/admin/auth', auth_routes_1.default);
// Phase 6: Visa Enquiry + Document Upload System
apiRouter.use('/visa-enquiries', visa_enquiry_routes_1.default);
// Business Setup Enquiries
apiRouter.use('/business-enquiries', business_enquiry_routes_1.default);
// Phase 8: Jobs & Recruitment System
apiRouter.use('/jobs', job_routes_1.default);
apiRouter.use('/admin/recruitment', admin_job_routes_1.default);
// Phase 9: Employer / Manpower Enquiry System
apiRouter.use('/manpower-enquiries', manpower_enquiry_routes_1.default);
apiRouter.use('/admin/manpower-enquiries', admin_manpower_routes_1.default);
// Phase 10: Testimonials Management
apiRouter.use('/testimonials', testimonial_routes_1.default);
apiRouter.use('/admin/testimonials', admin_testimonial_routes_1.default);
// Phase 11: Admin Dashboard & Management UI
apiRouter.use('/admin/dashboard', admin_dashboard_routes_1.default);
apiRouter.use('/admin/visa-enquiries', admin_visa_enquiry_routes_1.default);
apiRouter.use('/admin/notifications', admin_notification_routes_1.default);
apiRouter.use('/admin/audit-logs', admin_audit_log_routes_1.default);
// Phase 12: Analytics / Visitor Intelligence
apiRouter.use('/analytics', analytics_routes_1.default);
apiRouter.use('/admin/analytics', admin_analytics_routes_1.default);
// Future Phase Route Mounts (Strictly Deferred):
// Phase 13: Search & Content Discovery
exports.default = apiRouter;
