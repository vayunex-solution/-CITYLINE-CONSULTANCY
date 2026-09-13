/**
 * CITYLINE CONSULTANCY — API Routes Aggregator
 * Mounts all versioned sub-routers under the API prefix (/api/v1).
 */

import { Router } from 'express';
import healthRoutes from './health.routes';

const apiRouter = Router();

// Health monitoring endpoint under API prefix: /api/v1/health
apiRouter.use('/health', healthRoutes);

// Future Phase Route Mounts (Strictly Deferred):
// Phase 4: Admin Authentication & Security Foundation
// Phase 5: Public Website Implementation
// Phase 6: Visa Enquiry + Document Upload System
// Phase 7: SMTP Notification System
// Phase 8: Jobs & Recruitment System
// Phase 9: Employer / Manpower Enquiry System
// Phase 10: Testimonials Management
// Phase 11: Admin Dashboard & Management
// Phase 12: Analytics / Visitor Intelligence

export default apiRouter;
