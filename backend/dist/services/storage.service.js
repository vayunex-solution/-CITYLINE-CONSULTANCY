"use strict";
/**
 * CITYLINE CONSULTANCY — Private Filesystem Storage Service
 * Manages physical document storage outside public webroots with strict path isolation,
 * directory scoping, and transactional compensation cleanup.
 *
 * GOVERNANCE:
 * - Storage MUST remain strictly outside all webroots.
 * - Resolves all paths inside `STORAGE_ROOT` and verifies no path escapes.
 * - Stores files under `visa-enquiries/<enquiryId>/<randomId>.<ext>`.
 * - Provides cleanup primitives for orphan files on transaction rollback.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
class StorageService {
    storageRoot;
    constructor(customStorageRoot) {
        this.storageRoot = customStorageRoot || env_config_1.env.STORAGE_ROOT;
    }
    /**
     * Sets custom storage root (useful for isolated unit/integration tests).
     */
    setStorageRoot(customStorageRoot) {
        this.storageRoot = customStorageRoot;
    }
    getStorageRoot() {
        return this.storageRoot;
    }
    /**
     * Asserts that a resolved target path is strictly located within the configured storageRoot.
     */
    assertPathWithinStorageRoot(targetPath) {
        const resolvedRoot = path_1.default.resolve(this.storageRoot);
        const resolvedTarget = path_1.default.resolve(targetPath);
        const relative = path_1.default.relative(resolvedRoot, resolvedTarget);
        if (relative.startsWith('..') || path_1.default.isAbsolute(relative)) {
            throw new app_error_1.AppError('Storage path traversal detected.', 403, 'PATH_TRAVERSAL_BLOCKED');
        }
    }
    /**
     * Resolves a relative storage key to an absolute filesystem path and verifies it stays inside storageRoot.
     */
    getAbsolutePath(storageKey) {
        const safeKey = storageKey.replace(/\\/g, '/');
        const absolutePath = path_1.default.resolve(this.storageRoot, safeKey);
        this.assertPathWithinStorageRoot(absolutePath);
        return absolutePath;
    }
    /**
     * Writes a document buffer to the private storage directory for an enquiry.
     */
    async writeEnquiryFile(enquiryId, storageFilename, buffer) {
        // 1. Sanitize directory components
        const safeEnquiryDir = enquiryId.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeFilename = path_1.default.basename(storageFilename);
        if (!safeEnquiryDir || !safeFilename) {
            throw new app_error_1.AppError('Invalid storage path parameters.', 400, 'STORAGE_PATH_INVALID');
        }
        const relativeKey = path_1.default.posix.join('visa-enquiries', safeEnquiryDir, safeFilename);
        const targetDir = path_1.default.join(this.storageRoot, 'visa-enquiries', safeEnquiryDir);
        const absolutePath = path_1.default.join(targetDir, safeFilename);
        // Verify isolation
        this.assertPathWithinStorageRoot(absolutePath);
        // Ensure directory exists
        await fs_1.default.promises.mkdir(targetDir, { recursive: true });
        // Write file securely
        await fs_1.default.promises.writeFile(absolutePath, buffer, { mode: 0o600 });
        return {
            absolutePath,
            storageKey: relativeKey,
            sizeBytes: buffer.length,
        };
    }
    /**
     * Writes a candidate document (CV/Resume) buffer to private storage for a job application.
     */
    async writeApplicationFile(applicationId, storageFilename, buffer) {
        // 1. Sanitize directory components
        const safeAppDir = applicationId.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeFilename = path_1.default.basename(storageFilename);
        if (!safeAppDir || !safeFilename) {
            throw new app_error_1.AppError('Invalid storage path parameters.', 400, 'STORAGE_PATH_INVALID');
        }
        const relativeKey = path_1.default.posix.join('job-applications', safeAppDir, safeFilename);
        const targetDir = path_1.default.join(this.storageRoot, 'job-applications', safeAppDir);
        const absolutePath = path_1.default.join(targetDir, safeFilename);
        // Verify isolation
        this.assertPathWithinStorageRoot(absolutePath);
        // Ensure directory exists
        await fs_1.default.promises.mkdir(targetDir, { recursive: true });
        // Write file securely with restricted permissions
        await fs_1.default.promises.writeFile(absolutePath, buffer, { mode: 0o600 });
        return {
            absolutePath,
            storageKey: relativeKey,
            sizeBytes: buffer.length,
        };
    }
    /**
     * Cleans up an array of physical files on transaction rollback or failure.
     */
    async cleanupFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                this.assertPathWithinStorageRoot(filePath);
                if (fs_1.default.existsSync(filePath)) {
                    await fs_1.default.promises.unlink(filePath);
                    logger_1.logger.debug(`Cleaned up orphan file: ${filePath}`);
                    // Attempt to remove parent enquiry directory if empty
                    const parentDir = path_1.default.dirname(filePath);
                    try {
                        const remaining = await fs_1.default.promises.readdir(parentDir);
                        if (remaining.length === 0) {
                            await fs_1.default.promises.rmdir(parentDir);
                        }
                    }
                    catch {
                        // Ignore directory removal failures
                    }
                }
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                logger_1.logger.warn(`Failed to cleanup orphan file: ${filePath} (${errorMsg})`);
            }
        }
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
