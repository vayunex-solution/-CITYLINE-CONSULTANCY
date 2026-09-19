"use strict";
/**
 * CITYLINE CONSULTANCY — Self-Healing Database Migration Runner
 *
 * Automatically synchronizes Knex migration state between development (.ts)
 * and compiled production (.js) runtimes, normalizes recorded migration names,
 * and executes pending migrations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const knex_config_1 = __importDefault(require("../config/knex.config"));
async function runMigrations() {
    console.log('========================================================');
    console.log('  CITYLINE CONSULTANCY — DATABASE MIGRATION ENGINE');
    console.log('========================================================\n');
    const db = (0, knex_1.default)(knex_config_1.default);
    try {
        const migrationsDir = path_1.default.resolve(__dirname, '../database/migrations');
        console.log(`📁 Migration directory: ${migrationsDir}`);
        if (!fs_1.default.existsSync(migrationsDir)) {
            throw new Error(`Migration directory not found: ${migrationsDir}`);
        }
        const diskFiles = fs_1.default.readdirSync(migrationsDir);
        const hasJsFiles = diskFiles.some(f => f.endsWith('.js'));
        const hasTsFiles = diskFiles.some(f => f.endsWith('.ts'));
        console.log(`📦 Files found on disk: ${diskFiles.length} (${hasJsFiles ? 'JS' : ''}${hasJsFiles && hasTsFiles ? ', ' : ''}${hasTsFiles ? 'TS' : ''})`);
        // Ensure knex_migrations table exists before checking
        const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
        if (hasMigrationsTable) {
            // If we are executing in JS runtime (dist/), normalize any .ts entries in knex_migrations to .js
            if (hasJsFiles && !hasTsFiles) {
                const tsEntries = await db('knex_migrations')
                    .where('name', 'like', '%.ts')
                    .select('id', 'name');
                if (tsEntries.length > 0) {
                    console.log(`🔄 Normalizing ${tsEntries.length} migration records in database (.ts -> .js)...`);
                    for (const entry of tsEntries) {
                        const newName = entry.name.replace(/\.ts$/, '.js');
                        await db('knex_migrations')
                            .where('id', entry.id)
                            .update({ name: newName });
                        console.log(`   ✓ ${entry.name} -> ${newName}`);
                    }
                }
            }
            else if (hasTsFiles && !hasJsFiles) {
                // If in TS runtime, normalize any .js entries to .ts
                const jsEntries = await db('knex_migrations')
                    .where('name', 'like', '%.js')
                    .select('id', 'name');
                if (jsEntries.length > 0) {
                    console.log(`🔄 Normalizing ${jsEntries.length} migration records in database (.js -> .ts)...`);
                    for (const entry of jsEntries) {
                        const newName = entry.name.replace(/\.js$/, '.ts');
                        await db('knex_migrations')
                            .where('id', entry.id)
                            .update({ name: newName });
                        console.log(`   ✓ ${entry.name} -> ${newName}`);
                    }
                }
            }
        }
        console.log('\n⚙️  Running pending database migrations...');
        const [batchNo, log] = await db.migrate.latest({
            directory: migrationsDir,
            loadExtensions: hasJsFiles ? ['.js'] : ['.ts'],
        });
        if (!log || log.length === 0) {
            console.log('✅ Database schema is already up to date. No pending migrations.');
        }
        else {
            console.log(`✅ Successfully applied Batch #${batchNo} (${log.length} migration${log.length === 1 ? '' : 's'}):`);
            log.forEach((file) => console.log(`   ✓ ${file}`));
        }
        console.log('\n========================================================\n');
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error.message || error);
        process.exit(1);
    }
    finally {
        await db.destroy();
    }
}
runMigrations();
