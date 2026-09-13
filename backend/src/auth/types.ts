/**
 * CITYLINE CONSULTANCY — Administrative Authentication Types
 */

import { AdminRole } from '@cityline/shared';

export interface AuthenticatedAdminContext {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: AdminRole;
  roleId: number;
  tokenJti: string;
}
