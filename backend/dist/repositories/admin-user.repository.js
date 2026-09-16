"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative User Repository
 * Generic data access layer for administrative accounts and RBAC role associations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserRepository = exports.AdminUserRepository = void 0;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
class AdminUserRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'admin_users';
    /**
     * Finds an admin user by username or email, including associated RBAC role.
     */
    async findByIdentity(identity, trx) {
        try {
            const normalized = identity.trim().toLowerCase();
            const row = await this.getQuery(trx)
                .join('admin_roles', 'admin_users.role_id', 'admin_roles.id')
                .where('admin_users.username', normalized)
                .orWhere('admin_users.email', normalized)
                .select('admin_users.*', 'admin_roles.role_key', 'admin_roles.name as role_name')
                .first();
            if (!row)
                return null;
            return {
                ...row,
                is_active: Boolean(row.is_active),
            };
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'AdminUserRepository.findByIdentity');
        }
    }
    /**
     * Finds an active or inactive admin user by UUID, including associated role.
     */
    async findByIdWithRole(id, trx) {
        try {
            const row = await this.getQuery(trx)
                .join('admin_roles', 'admin_users.role_id', 'admin_roles.id')
                .where('admin_users.id', id)
                .select('admin_users.*', 'admin_roles.role_key', 'admin_roles.name as role_name')
                .first();
            if (!row)
                return null;
            return {
                ...row,
                is_active: Boolean(row.is_active),
            };
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'AdminUserRepository.findByIdWithRole');
        }
    }
    /**
     * Updates an admin user's last_login_at timestamp.
     */
    async updateLastLogin(id, trx) {
        try {
            const now = new Date();
            await this.getQuery(trx)
                .where({ id })
                .update({
                last_login_at: now,
                updated_at: now,
            });
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'AdminUserRepository.updateLastLogin');
        }
    }
}
exports.AdminUserRepository = AdminUserRepository;
exports.adminUserRepository = new AdminUserRepository();
