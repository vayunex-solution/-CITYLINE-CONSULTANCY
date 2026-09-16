/**
 * CITYLINE CONSULTANCY — Secure Multipart Document Upload Middleware
 * Utilizes Multer with a custom BoundedMemoryStorage engine to enforce real-time streaming
 * limits on both individual file sizes and aggregate request payload size prior to full RAM buffering.
 *
 * GOVERNANCE:
 * - Pre-checks Content-Length header before stream processing begins.
 * - Streams chunks with active aggregate byte tracking to prevent memory exhaustion (DoS).
 * - Enforces individual file limit (10MB), total upload limit (25MB), file count (5), and field count (20).
 * - Immediately halts socket stream reading on boundary violations.
 * - Normalizes Multer limit errors into standard AppErrors.
 */

import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine } from 'multer';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

/**
 * Custom bounded memory storage engine that tracks cumulative upload bytes across all files
 * during active streaming, aborting streams immediately if per-file or aggregate limits are breached.
 */
class BoundedMemoryStorage implements StorageEngine {
  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    const chunks: Buffer[] = [];
    let fileBytes = 0;
    const maxFileBytes = env.UPLOAD_MAX_FILE_SIZE_BYTES;
    const maxTotalBytes = env.UPLOAD_MAX_TOTAL_SIZE_BYTES;

    const reqState = req as unknown as { _cumulativeUploadedBytes?: number };
    reqState._cumulativeUploadedBytes = reqState._cumulativeUploadedBytes || 0;

    let aborted = false;

    const onData = (chunk: Buffer) => {
      if (aborted) return;

      fileBytes += chunk.length;
      reqState._cumulativeUploadedBytes = (reqState._cumulativeUploadedBytes || 0) + chunk.length;

      // 1. Individual file size boundary
      if (fileBytes > maxFileBytes) {
        aborted = true;
        file.stream.removeListener('data', onData);
        file.stream.destroy();
        return cb(new multer.MulterError('LIMIT_FILE_SIZE', file.fieldname));
      }

      // 2. Aggregate request upload boundary
      if (reqState._cumulativeUploadedBytes > maxTotalBytes) {
        aborted = true;
        file.stream.removeListener('data', onData);
        file.stream.destroy();
        const err = new multer.MulterError('LIMIT_FILE_SIZE', file.fieldname);
        err.message = 'Total upload payload exceeds aggregate limit';
        (err as any).code = 'LIMIT_TOTAL_FILE_SIZE';
        return cb(err);
      }

      chunks.push(chunk);
    };

    file.stream.on('data', onData);

    file.stream.on('end', () => {
      if (aborted) return;
      const buffer = Buffer.concat(chunks);
      cb(null, {
        buffer,
        size: buffer.length,
      });
    });

    file.stream.on('error', (err) => {
      if (aborted) return;
      cb(err);
    });
  }

  _removeFile(_req: Request, _file: Express.Multer.File, cb: (error: Error | null) => void): void {
    cb(null);
  }
}

const storage = new BoundedMemoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_BYTES, // 10MB
    files: env.UPLOAD_MAX_FILES_PER_ENQUIRY, // 5 files max
    fields: 20, // Max 20 text fields to prevent multipart non-file flooding
    fieldSize: 100 * 1024, // 100KB max per text field
    parts: 30, // Max 30 total parts (fields + files)
  },
});

export const visaEnquiryUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Immediate Content-Length pre-check: reject before buffering a single byte
  const contentLength = req.headers['content-length']
    ? parseInt(req.headers['content-length'], 10)
    : NaN;

  if (!isNaN(contentLength) && contentLength > env.UPLOAD_MAX_TOTAL_SIZE_BYTES) {
    const maxMb = Math.round(env.UPLOAD_MAX_TOTAL_SIZE_BYTES / (1024 * 1024));
    return next(
      new AppError(
        `Total upload payload exceeds the maximum allowed limit of ${maxMb}MB.`,
        413,
        'PAYLOAD_TOO_LARGE'
      )
    );
  }

  // 2. Delegate to BoundedMemoryStorage Multer parser
  upload.array('documents', env.UPLOAD_MAX_FILES_PER_ENQUIRY)(req, res, (err: unknown) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if ((err as any).code === 'LIMIT_TOTAL_FILE_SIZE') {
        const maxMb = Math.round(env.UPLOAD_MAX_TOTAL_SIZE_BYTES / (1024 * 1024));
        return next(
          new AppError(
            `Total upload payload exceeds the maximum allowed limit of ${maxMb}MB.`,
            413,
            'PAYLOAD_TOO_LARGE'
          )
        );
      }

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

      if (err.code === 'LIMIT_FIELD_COUNT' || err.code === 'LIMIT_PART_COUNT') {
        return next(
          new AppError(
            'Multipart request exceeds maximum permitted field count.',
            400,
            'TOO_MANY_FIELDS'
          )
        );
      }

      if (err.code === 'LIMIT_FIELD_VALUE') {
        return next(
          new AppError(
            'One or more form fields exceed the maximum allowed size (100KB).',
            400,
            'FIELD_TOO_LARGE'
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

const jobCvUpload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_BYTES, // 10MB
    files: 1, // Strictly 1 CV file per application
    fields: 20, // Max 20 text fields
    fieldSize: 100 * 1024, // 100KB per text field
    parts: 25,
  },
});

export const jobApplicationUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Immediate Content-Length pre-check
  const contentLength = req.headers['content-length']
    ? parseInt(req.headers['content-length'], 10)
    : NaN;

  if (!isNaN(contentLength) && contentLength > env.UPLOAD_MAX_FILE_SIZE_BYTES) {
    const maxMb = Math.round(env.UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024));
    return next(
      new AppError(
        `Total upload payload exceeds the maximum allowed CV limit of ${maxMb}MB.`,
        413,
        'PAYLOAD_TOO_LARGE'
      )
    );
  }

  // 2. Delegate to Multer parser supporting 'cv' or 'resume' field
  jobCvUpload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ])(req, res, (err: unknown) => {
    if (!err) {
      // Normalize req.file from fields for downstream handlers
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files) {
        if (files['cv'] && files['cv'].length > 0) {
          req.file = files['cv'][0];
        } else if (files['resume'] && files['resume'].length > 0) {
          req.file = files['resume'][0];
        }
      }
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE' || (err as any).code === 'LIMIT_TOTAL_FILE_SIZE') {
        const maxMb = Math.round(env.UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024));
        return next(
          new AppError(
            `The uploaded CV file exceeds the maximum permitted size of ${maxMb}MB.`,
            413,
            'FILE_TOO_LARGE'
          )
        );
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(
          new AppError('Only one CV document may be uploaded per application.', 400, 'TOO_MANY_FILES')
        );
      }

      if (err.code === 'LIMIT_FIELD_COUNT' || err.code === 'LIMIT_PART_COUNT') {
        return next(
          new AppError('Multipart request exceeds maximum permitted field count.', 400, 'TOO_MANY_FIELDS')
        );
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(
            `Unexpected upload field "${err.field}". Please upload your CV under the "cv" or "resume" field.`,
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

/**
 * Optional multipart document upload middleware for Business Setup & Consultation Enquiries.
 * If multipart/form-data is detected, applies bounded memory storage limits and parses 'documents'.
 * Otherwise, cleanly delegates through for JSON-based submissions.
 */
export const businessEnquiryUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return visaEnquiryUploadMiddleware(req, res, next);
  }
  return next();
};

