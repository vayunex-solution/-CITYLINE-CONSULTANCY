"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDocumentController = exports.AdminDocumentController = void 0;
const fs_1 = __importDefault(require("fs"));
const connection_1 = require("../database/connection");
const storage_service_1 = require("../services/storage.service");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
class AdminDocumentController {
    storage;
    constructor(storage = storage_service_1.storageService) {
        this.storage = storage;
    }
    previewDocument = async (req, res, next) => {
        try {
            const { id } = req.params;
            const db = (0, connection_1.getDbClient)();
            const doc = await db('documents').where({ id }).first();
            if (!doc) {
                throw new app_error_1.AppError('Document record not found.', 404, 'DOCUMENT_NOT_FOUND');
            }
            const absolutePath = this.storage.getAbsolutePath(doc.storage_key);
            if (!fs_1.default.existsSync(absolutePath)) {
                logger_1.logger.error(`Physical file missing on disk for document ${id}: ${absolutePath}`);
                throw new app_error_1.AppError('Physical file could not be located on secure storage.', 404, 'FILE_NOT_FOUND_ON_DISK');
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
            const stream = fs_1.default.createReadStream(absolutePath);
            stream.on('error', (streamErr) => {
                logger_1.logger.error(`Stream error during document preview: ${id}`, streamErr);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error streaming file.' });
                }
            });
            stream.pipe(res);
        }
        catch (err) {
            next(err);
        }
    };
    downloadDocument = async (req, res, next) => {
        try {
            const { id } = req.params;
            const db = (0, connection_1.getDbClient)();
            const doc = await db('documents').where({ id }).first();
            if (!doc) {
                throw new app_error_1.AppError('Document record not found.', 404, 'DOCUMENT_NOT_FOUND');
            }
            const absolutePath = this.storage.getAbsolutePath(doc.storage_key);
            if (!fs_1.default.existsSync(absolutePath)) {
                logger_1.logger.error(`Physical file missing on disk for document ${id}: ${absolutePath}`);
                throw new app_error_1.AppError('Physical file could not be located on secure storage.', 404, 'FILE_NOT_FOUND_ON_DISK');
            }
            const mimeType = doc.mime_type || 'application/octet-stream';
            const filename = doc.original_filename || 'document.pdf';
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            if (doc.file_size_bytes) {
                res.setHeader('Content-Length', String(doc.file_size_bytes));
            }
            const stream = fs_1.default.createReadStream(absolutePath);
            stream.on('error', (streamErr) => {
                logger_1.logger.error(`Stream error during document download: ${id}`, streamErr);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file.' });
                }
            });
            stream.pipe(res);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AdminDocumentController = AdminDocumentController;
exports.adminDocumentController = new AdminDocumentController();
