/**
 * CITYLINE CONSULTANCY — Secure Multipart Document Upload Middleware
 * Utilizes Multer with in-memory buffering to allow deep binary signature,
 * magic byte, and DOCX archive inspection prior to physical filesystem persistence.
 *
 * GOVERNANCE:
 * - Enforces per-file and file-count constraints at the HTTP pipeline boundary.
 * - Captures buffers in memory to prevent arbitrary files landing on disk before validation.
 * - Normalizes Multer limit errors into standard AppErrors.
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_BYTES,
    files: env.UPLOAD_MAX_FILES_PER_ENQUIRY,
    fieldSize: 100 * 1024, // 100KB for text fields
  },
});

export const visaEnquiryUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Support both 'documents' array and optional files
  upload.array('documents', env.UPLOAD_MAX_FILES_PER_ENQUIRY)(req, res, (err: unknown) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMb = Math.round(env.UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024));
        return next(
          new AppError(
            `One or more uploaded files exceed the maximum permitted size of ${maxMb}MB.`,
            413,
            'FILE_TOO_LARGE'
          )
        );
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(
          new AppError(
            `Cannot upload more than ${env.UPLOAD_MAX_FILES_PER_ENQUIRY} documents per enquiry.`,
            400,
            'TOO_MANY_FILES'
          )
        );
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(
            `Unexpected form field "${err.field}". Please upload documents under the "documents" field.`,
            400,
            'UNEXPECTED_UPLOAD_FIELD'
          )
        );
      }

      return next(new AppError(`File upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
    }

    const errorMsg = err instanceof Error ? err.message : 'File upload processing failed';
    return next(new AppError(errorMsg, 400, 'UPLOAD_PROCESSING_FAILED'));
  });
};
