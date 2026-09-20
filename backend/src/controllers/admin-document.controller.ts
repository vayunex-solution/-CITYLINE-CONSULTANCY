/**
 * CITYLINE CONSULTANCY — Administrative Document Controller
 * Coordinates secure streaming, inline browser previewing, and downloads
 * of customer-submitted documents (PDFs, resumes, certificates).
 *
 * GOVERNANCE:
 * - Requires verified administrative authentication session.
 * - Filesystem storage paths are never leaked to the client.
 * - Enforces path confinement within STORAGE_ROOT.
 * - Sets strict security headers (no-sniff, sandboxing).
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { getDbClient } from '../database/connection';
import { storageService, StorageService } from '../services/storage.service';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export class AdminDocumentController {
  constructor(private storage: StorageService = storageService) {}

  public previewDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const db = getDbClient();

      const doc = await db('documents').where({ id }).first();
      if (!doc) {
        throw new AppError('Document record not found.', 404, 'DOCUMENT_NOT_FOUND');
      }

      const absolutePath = this.storage.getAbsolutePath(doc.storage_key);
      if (!fs.existsSync(absolutePath)) {
        logger.error(`Physical file missing on disk for document ${id}: ${absolutePath}`);
        throw new AppError('Physical file could not be located on secure storage.', 404, 'FILE_NOT_FOUND_ON_DISK');
      }

      const mimeType = doc.mime_type || 'application/octet-stream';
      const filename = doc.original_filename || 'document.pdf';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      if (doc.file_size_bytes) {
        res.setHeader('Content-Length', String(doc.file_size_bytes));
      }

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', (streamErr) => {
        logger.error(`Stream error during document preview: ${id}`, streamErr);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file.' });
        }
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };

  public downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const db = getDbClient();

      const doc = await db('documents').where({ id }).first();
      if (!doc) {
        throw new AppError('Document record not found.', 404, 'DOCUMENT_NOT_FOUND');
      }

      const absolutePath = this.storage.getAbsolutePath(doc.storage_key);
      if (!fs.existsSync(absolutePath)) {
        logger.error(`Physical file missing on disk for document ${id}: ${absolutePath}`);
        throw new AppError('Physical file could not be located on secure storage.', 404, 'FILE_NOT_FOUND_ON_DISK');
      }

      const mimeType = doc.mime_type || 'application/octet-stream';
      const filename = doc.original_filename || 'document.pdf';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (doc.file_size_bytes) {
        res.setHeader('Content-Length', String(doc.file_size_bytes));
      }

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', (streamErr) => {
        logger.error(`Stream error during document download: ${id}`, streamErr);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file.' });
        }
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
}

export const adminDocumentController = new AdminDocumentController();
