/**
 * CITYLINE CONSULTANCY — API Routes Aggregator
 * Mounts all versioned sub-routers under the API prefix (/api/v1).
 */

import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import visaEnquiryRoutes from './visa-enquiry.routes';
import jobRoutes from './job.routes';
import adminJobRoutes from './admin-job.routes';
import manpowerEnquiryRoutes from './manpower-enquiry.routes';
import adminManpowerRoutes from './admin-manpower.routes';
import businessEnquiryRoutes from './business-enquiry.routes';
import testimonialRoutes from './testimonial.routes';
import adminTestimonialRoutes from './admin-testimonial.routes';
import adminDashboardRoutes from './admin-dashboard.routes';
import adminVisaEnquiryRoutes from './admin-visa-enquiry.routes';
import adminNotificationRoutes from './admin-notification.routes';
import adminAuditLogRoutes from './admin-audit-log.routes';
import analyticsRoutes from './analytics.routes';
import adminAnalyticsRoutes from './admin-analytics.routes';
import adminMasterRoutes from './admin-master.routes';
import adminSettingRoutes from './admin-setting.routes';
import adminDocumentRoutes from './admin-document.routes';

const apiRouter = Router();

// Health monitoring endpoint under API prefix: /api/v1/health
apiRouter.use('/health', healthRoutes);

// Phase 4: Admin Authentication & Security Foundation
apiRouter.use('/admin/auth', authRoutes);

// Phase 6: Visa Enquiry + Document Upload System
apiRouter.use('/visa-enquiries', visaEnquiryRoutes);

// Business Setup Enquiries
apiRouter.use('/business-enquiries', businessEnquiryRoutes);

// Phase 8: Jobs & Recruitment System
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/admin/recruitment', adminJobRoutes);

// Phase 9: Employer / Manpower Enquiry System
apiRouter.use('/manpower-enquiries', manpowerEnquiryRoutes);
apiRouter.use('/admin/manpower-enquiries', adminManpowerRoutes);

// Phase 10: Testimonials Management
apiRouter.use('/testimonials', testimonialRoutes);
apiRouter.use('/admin/testimonials', adminTestimonialRoutes);

// Phase 11: Admin Dashboard & Management UI
apiRouter.use('/admin/dashboard', adminDashboardRoutes);
apiRouter.use('/admin/visa-enquiries', adminVisaEnquiryRoutes);
apiRouter.use('/admin/documents', adminDocumentRoutes);
apiRouter.use('/admin/notifications', adminNotificationRoutes);
apiRouter.use('/admin/audit-logs', adminAuditLogRoutes);
apiRouter.use('/admin/master', adminMasterRoutes);
apiRouter.use('/admin/settings', adminSettingRoutes);

// Phase 12: Analytics / Visitor Intelligence
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/admin/analytics', adminAnalyticsRoutes);

// Future Phase Route Mounts (Strictly Deferred):
// Phase 13: Search & Content Discovery

export default apiRouter;
