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

const apiRouter = Router();

// Health monitoring endpoint under API prefix: /api/v1/health
apiRouter.use('/health', healthRoutes);

// Phase 4: Admin Authentication & Security Foundation
apiRouter.use('/admin/auth', authRoutes);

// Phase 6: Visa Enquiry + Document Upload System
apiRouter.use('/visa-enquiries', visaEnquiryRoutes);

// Phase 8: Jobs & Recruitment System
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/admin/recruitment', adminJobRoutes);

// Future Phase Route Mounts (Strictly Deferred):
// Phase 9: Employer / Manpower Enquiry System
// Phase 10: Testimonials Management
// Phase 11: Admin Dashboard & Management UI
// Phase 12: Analytics / Visitor Intelligence

export default apiRouter;
