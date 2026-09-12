/**
 * CITYLINE CONSULTANCY — API Routes Aggregator
 * Mounts all versioned sub-routers under the API prefix (/api/v1).
 */

import { Router } from 'express';
import healthRoutes from './health.routes';

const apiRouter = Router();

// Health monitoring endpoint under API prefix: /api/v1/health
apiRouter.use('/health', healthRoutes);

// Future Phase Route Mounts:
// Phase 2: Database health / readiness
// Phase 3: Public enquiries & jobs
// Phase 4: Admin authentication
// Phase 5: Admin portal & RBAC
// Phase 6: Document storage / verification

export default apiRouter;
