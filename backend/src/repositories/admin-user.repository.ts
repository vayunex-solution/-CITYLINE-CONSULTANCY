/**
 * CITYLINE CONSULTANCY — Administrative User Repository
 * Generic data access layer for administrative accounts and RBAC role associations.
 */

import { Knex } from 'knex';
import { AdminRole } from '@cityline/shared';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';

export interface AdminUserRecord {
  [key: string]: unknown;
  id: string;
  role_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  is_active: boolean | number;
  last_login_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AdminUserWithRole extends AdminUserRecord {
  role_key: AdminRole;
  role_name: string;
}

export class AdminUserRepository extends AbstractKnexRepository<AdminUserRecord, string> {
  protected readonly tableName = 'admin_users';

  /**
   * Finds an admin user by username or email, including associated RBAC role.
   */
  public async findByIdentity(identity: string, trx?: Knex.Transaction): Promise<AdminUserWithRole | null> {
    try {
      const normalized = identity.trim().toLowerCase();
      const row = await this.getQuery(trx)
        .join('admin_roles', 'admin_users.role_id', 'admin_roles.id')
        .where('admin_users.username', normalized)
        .orWhere('admin_users.email', normalized)
        .select(
          'admin_users.*',
          'admin_roles.role_key',
          'admin_roles.name as role_name'
        )
        .first();

      if (!row) return null;

      return {
        ...row,
        is_active: Boolean(row.is_active),
      } as AdminUserWithRole;
    } catch (error) {
      throw normalizeDatabaseError(error, 'AdminUserRepository.findByIdentity');
    }
  }

  /**
   * Finds an active or inactive admin user by UUID, including associated role.
   */
  public async findByIdWithRole(id: string, trx?: Knex.Transaction): Promise<AdminUserWithRole | null> {
    try {
      const row = await this.getQuery(trx)
        .join('admin_roles', 'admin_users.role_id', 'admin_roles.id')
        .where('admin_users.id', id)
        .select(
          'admin_users.*',
          'admin_roles.role_key',
          'admin_roles.name as role_name'
        )
        .first();

      if (!row) return null;

      return {
        ...row,
        is_active: Boolean(row.is_active),
      } as AdminUserWithRole;
    } catch (error) {
      throw normalizeDatabaseError(error, 'AdminUserRepository.findByIdWithRole');
    }
  }

  /**
   * Updates an admin user's last_login_at timestamp.
   */
  public async updateLastLogin(id: string, trx?: Knex.Transaction): Promise<void> {
    try {
      const now = new Date();
      await this.getQuery(trx)
        .where({ id })
        .update({
          last_login_at: now,
          updated_at: now,
        });
    } catch (error) {
      throw normalizeDatabaseError(error, 'AdminUserRepository.updateLastLogin');
    }
  }
}

export const adminUserRepository = new AdminUserRepository();
