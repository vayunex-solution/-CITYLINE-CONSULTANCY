/**
 * CITYLINE CONSULTANCY — Storage Service & Path Traversal Defense Test Suite
 * Verifies private filesystem storage isolation, directory structure,
 * path traversal defense, and orphan-file cleanup compensation.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { StorageService } from '../src/services/storage.service';
import { AppError } from '../src/utils/app-error';

describe('Storage Service & Filesystem Isolation', () => {
  let testStorageRoot: string;
  let storage: StorageService;

  before(async () => {
    // Create an isolated temporary storage directory
    testStorageRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'clc-test-storage-'));
    storage = new StorageService(testStorageRoot);
  });

  after(async () => {
    // Clean up temporary test directory
    try {
      if (fs.existsSync(testStorageRoot)) {
        await fs.promises.rm(testStorageRoot, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  it('stores uploaded document in private scoped directory outside webroot', async () => {
    const enquiryId = '550e8400-e29b-41d4-a716-446655440000';
    const storageFilename = 'passport-scan.pdf';
    const content = Buffer.from('%PDF-1.7 mock document content');

    const result = await storage.writeEnquiryFile(enquiryId, storageFilename, content);

    // Verify storageKey is a relative POSIX key suitable for DB storage
    assert.strictEqual(
      result.storageKey,
      `visa-enquiries/${enquiryId}/${storageFilename}`
    );

    // Verify physical file exists at absolute path
    assert.strictEqual(fs.existsSync(result.absolutePath), true);

    // Verify content written matches
    const saved = await fs.promises.readFile(result.absolutePath);
    assert.deepStrictEqual(saved, content);

    // Verify file is strictly inside testStorageRoot
    const relative = path.relative(testStorageRoot, result.absolutePath);
    assert.strictEqual(relative.startsWith('..'), false);
    assert.strictEqual(path.isAbsolute(relative), false);
  });

  it('sanitizes malicious directory traversal in enquiryId and storageFilename', async () => {
    const traversalEnquiryId = '../../etc/shadow';
    const traversalFilename = '../../../../boot.ini';
    const content = Buffer.from('payload');

    const result = await storage.writeEnquiryFile(traversalEnquiryId, traversalFilename, content);

    // Verify result is strictly contained inside testStorageRoot
    const relative = path.relative(testStorageRoot, result.absolutePath);
    assert.strictEqual(relative.startsWith('..'), false);
    assert.strictEqual(path.isAbsolute(relative), false);

    // Filename should be stripped to basename
    assert.strictEqual(path.basename(result.absolutePath), 'boot.ini');
  });

  it('blocks and throws PATH_TRAVERSAL_BLOCKED if an internal path escapes storage root', async () => {
    // Calling internal assertion directly with an escaped path
    const outsidePath = path.resolve(testStorageRoot, '../../escaped.txt');

    // Using private method check via any
    assert.throws(
      () => (storage as any).assertPathWithinStorageRoot(outsidePath),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'PATH_TRAVERSAL_BLOCKED');
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  it('successfully cleans up orphan files and removes empty enquiry directory', async () => {
    const enquiryId = 'orphan-test-enquiry';
    const file1 = await storage.writeEnquiryFile(enquiryId, 'file1.pdf', Buffer.from('data1'));
    const file2 = await storage.writeEnquiryFile(enquiryId, 'file2.jpg', Buffer.from('data2'));

    assert.strictEqual(fs.existsSync(file1.absolutePath), true);
    assert.strictEqual(fs.existsSync(file2.absolutePath), true);

    // Clean up files
    await storage.cleanupFiles([file1.absolutePath, file2.absolutePath]);

    // Verify physical files are unlinked
    assert.strictEqual(fs.existsSync(file1.absolutePath), false);
    assert.strictEqual(fs.existsSync(file2.absolutePath), false);

    // Verify enquiry parent directory was removed
    const enquiryDir = path.dirname(file1.absolutePath);
    assert.strictEqual(fs.existsSync(enquiryDir), false);
  });

  it('cleanupFiles fails safely when asked to clean non-existent or invalid paths', async () => {
    const nonExistent = path.join(testStorageRoot, 'visa-enquiries', 'fake', 'ghost.pdf');
    const outsideTraversal = path.resolve(testStorageRoot, '../../etc/passwd');

    // Should not throw or crash
    await storage.cleanupFiles([nonExistent, outsideTraversal]);
  });
});
