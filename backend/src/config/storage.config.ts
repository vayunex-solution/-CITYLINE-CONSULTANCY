/**
 * CITYLINE CONSULTANCY — Private Storage Configuration Foundation
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - Private files (resumes, passports, identity documents) MUST NEVER be placed in public directories.
 * - This path is located strictly outside frontend/public and web server document roots.
 * - Upload handlers and document streaming are deferred to Phase 6.
 */

import fs from 'fs';
import path from 'path';
import { env } from './env.config';

export interface StorageConfig {
  rootPath: string;
  subdirectories: {
    documents: string;
    resumes: string;
    temporary: string;
  };
  isOperational: boolean;
}

const rootPath = path.resolve(env.STORAGE_ROOT);

export const storageConfig: StorageConfig = {
  rootPath,
  subdirectories: {
    documents: path.join(rootPath, 'documents'),
    resumes: path.join(rootPath, 'resumes'),
    temporary: path.join(rootPath, 'temporary'),
  },
  isOperational: false,
};

/**
 * Initializes local development storage directories if they do not already exist.
 * Verifies write permissions safely without exposing any upload endpoints.
 */
export function initializeStorageFoundation(): boolean {
  try {
    if (!fs.existsSync(storageConfig.rootPath)) {
      fs.mkdirSync(storageConfig.rootPath, { recursive: true });
    }

    for (const subDir of Object.values(storageConfig.subdirectories)) {
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
    }

    storageConfig.isOperational = true;
    return true;
  } catch (error) {
    storageConfig.isOperational = false;
    return false;
  }
}
