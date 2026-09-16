"use strict";
/**
 * CITYLINE CONSULTANCY — Private Storage Configuration Foundation
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - Private files (resumes, passports, identity documents) MUST NEVER be placed in public directories.
 * - Canonical Development Location: ~/clc_storage/ (e.g. C:\Users\<user>\clc_storage or /home/<user>/clc_storage)
 * - Canonical Production Location: /home/<cpanel-user>/clc_storage/ (strictly outside public_html)
 * - Repository-local storage directories (e.g., ./storage/) are strictly prohibited as application storage roots.
 * - Upload handlers and document streaming are deferred to Phase 6.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
exports.initializeStorageFoundation = initializeStorageFoundation;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_config_1 = require("./env.config");
const rootPath = path_1.default.resolve(env_config_1.env.STORAGE_ROOT);
exports.storageConfig = {
    rootPath,
    subdirectories: {
        documents: path_1.default.join(rootPath, 'documents'),
        resumes: path_1.default.join(rootPath, 'resumes'),
        temporary: path_1.default.join(rootPath, 'temporary'),
    },
    isOperational: false,
};
/**
 * Initializes private storage directories if they do not already exist.
 * Verifies write permissions safely without exposing any upload endpoints.
 */
function initializeStorageFoundation() {
    try {
        if (!fs_1.default.existsSync(exports.storageConfig.rootPath)) {
            fs_1.default.mkdirSync(exports.storageConfig.rootPath, { recursive: true });
        }
        for (const subDir of Object.values(exports.storageConfig.subdirectories)) {
            if (!fs_1.default.existsSync(subDir)) {
                fs_1.default.mkdirSync(subDir, { recursive: true });
            }
        }
        exports.storageConfig.isOperational = true;
        return true;
    }
    catch (error) {
        exports.storageConfig.isOperational = false;
        return false;
    }
}
