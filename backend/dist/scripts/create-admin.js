"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Account Provisioning Utility
 * CLI tool for safely provisioning administrative accounts with Argon2id password hashing.
 *
 * USAGE:
 *   npx tsx src/scripts/create-admin.ts <username> <email> <password> [super_admin|admin_operator] [fullName]
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const password_1 = require("../auth/password");
const crypto_1 = __importDefault(require("crypto"));
async function createAdmin() {
    const args = process.argv.slice(2);
    const username = args[0];
    const email = args[1];
    const password = args[2];
    const roleKey = args[3] || 'super_admin';
    const fullName = args[4] || 'System Administrator';
    if (!username || !email || !password) {
        console.log('====================================================');
        console.log('CITYLINE CONSULTANCY — Admin Provisioning Tool');
        console.log('====================================================');
        console.log('Usage:');
        console.log('  npm run admin:create <username> <email> <password> [role] [fullName]');
        console.log('');
        console.log('Example:');
        console.log('  npm run admin:create admin admin@citylineconsultancy.com YourSecurePassword123! super_admin "Chief Admin"');
        console.log('====================================================');
        process.exit(0);
    }
    const policy = (0, password_1.validatePasswordPolicy)(password);
    if (!policy.valid) {
        console.error(`[FAIL] Password does not meet security requirements: ${policy.message}`);
        process.exit(1);
    }
    const db = (0, connection_1.getDbClient)();
    try {
        // 1. Verify role
        const role = await db('admin_roles').where({ role_key: roleKey }).first();
        if (!role) {
            console.error(`[FAIL] Role "${roleKey}" not found in admin_roles table.`);
            process.exit(1);
        }
        // 2. Hash password with Argon2id
        const passwordHash = await (0, password_1.hashPassword)(password);
        const adminId = crypto_1.default.randomUUID();
        // 3. Insert or update admin user
        const existing = await db('admin_users')
            .where('username', username.toLowerCase())
            .orWhere('email', email.toLowerCase())
            .first();
        if (existing) {
            await db('admin_users')
                .where({ id: existing.id })
                .update({
                password_hash: passwordHash,
                role_id: role.id,
                full_name: fullName,
                is_active: 1,
                updated_at: new Date(),
            });
            console.log(`[PASS] Existing admin user "${username}" updated successfully with role "${roleKey}".`);
        }
        else {
            await db('admin_users').insert({
                id: adminId,
                role_id: role.id,
                username: username.toLowerCase().trim(),
                email: email.toLowerCase().trim(),
                password_hash: passwordHash,
                full_name: fullName,
                is_active: 1,
                created_at: new Date(),
                updated_at: new Date(),
            });
            console.log(`[PASS] Admin user "${username}" created successfully with role "${roleKey}".`);
        }
        console.log(`[INFO] Identity: ${username} (${email})`);
        console.log(`[INFO] Role:     ${roleKey}`);
        console.log('You can now log in at: http://localhost:3000/admin/login');
    }
    catch (err) {
        console.error(`[FAIL] Database Error: ${err.message}`);
        if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
            console.error('\nNOTE: The database user needs permission to access the target database in cPanel.');
        }
    }
    finally {
        await db.destroy();
    }
}
createAdmin();
