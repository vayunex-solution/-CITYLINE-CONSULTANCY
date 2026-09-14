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

import fs from 'fs';
import path from 'path';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export interface StorageResult {
  absolutePath: string;
  storageKey: string;
  sizeBytes: number;
}

export class StorageService {
  private storageRoot: string;

  constructor(customStorageRoot?: string) {
    this.storageRoot = customStorageRoot || env.STORAGE_ROOT;
  }

  /**
   * Sets custom storage root (useful for isolated unit/integration tests).
   */
  public setStorageRoot(customStorageRoot: string): void {
    this.storageRoot = customStorageRoot;
  }

  public getStorageRoot(): string {
    return this.storageRoot;
  }

  /**
   * Asserts that a resolved target path is strictly located within the configured storageRoot.
   */
  private assertPathWithinStorageRoot(targetPath: string): void {
    const resolvedRoot = path.resolve(this.storageRoot);
    const resolvedTarget = path.resolve(targetPath);
    const relative = path.relative(resolvedRoot, resolvedTarget);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AppError('Storage path traversal detected.', 403, 'PATH_TRAVERSAL_BLOCKED');
    }
  }

  /**
   * Writes a document buffer to the private storage directory for an enquiry.
   */
  public async writeEnquiryFile(
    enquiryId: string,
    storageFilename: string,
    buffer: Buffer
  ): Promise<StorageResult> {
    // 1. Sanitize directory components
    const safeEnquiryDir = enquiryId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = path.basename(storageFilename);

    if (!safeEnquiryDir || !safeFilename) {
      throw new AppError('Invalid storage path parameters.', 400, 'STORAGE_PATH_INVALID');
    }

    const relativeKey = path.posix.join('visa-enquiries', safeEnquiryDir, safeFilename);
    const targetDir = path.join(this.storageRoot, 'visa-enquiries', safeEnquiryDir);
    const absolutePath = path.join(targetDir, safeFilename);

    // Verify isolation
    this.assertPathWithinStorageRoot(absolutePath);

    // Ensure directory exists
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Write file securely
    await fs.promises.writeFile(absolutePath, buffer, { mode: 0o600 });

    return {
      absolutePath,
      storageKey: relativeKey,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Writes a candidate document (CV/Resume) buffer to private storage for a job application.
   */
  public async writeApplicationFile(
    applicationId: string,
    storageFilename: string,
    buffer: Buffer
  ): Promise<StorageResult> {
    // 1. Sanitize directory components
    const safeAppDir = applicationId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = path.basename(storageFilename);

    if (!safeAppDir || !safeFilename) {
      throw new AppError('Invalid storage path parameters.', 400, 'STORAGE_PATH_INVALID');
    }

    const relativeKey = path.posix.join('job-applications', safeAppDir, safeFilename);
    const targetDir = path.join(this.storageRoot, 'job-applications', safeAppDir);
    const absolutePath = path.join(targetDir, safeFilename);

    // Verify isolation
    this.assertPathWithinStorageRoot(absolutePath);

    // Ensure directory exists
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Write file securely with restricted permissions
    await fs.promises.writeFile(absolutePath, buffer, { mode: 0o600 });

    return {
      absolutePath,
      storageKey: relativeKey,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Cleans up an array of physical files on transaction rollback or failure.
   */
  public async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        this.assertPathWithinStorageRoot(filePath);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          logger.debug(`Cleaned up orphan file: ${filePath}`);

          // Attempt to remove parent enquiry directory if empty
          const parentDir = path.dirname(filePath);
          try {
            const remaining = await fs.promises.readdir(parentDir);
            if (remaining.length === 0) {
              await fs.promises.rmdir(parentDir);
            }
          } catch {
            // Ignore directory removal failures
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(`Failed to cleanup orphan file: ${filePath} (${errorMsg})`);
      }
    }
  }
}

export const storageService = new StorageService();
