/**
 * CITYLINE CONSULTANCY — Document Security & Validation Engine
 * Enforces magic-byte inspection, MIME allowlist verification, DOCX zip-bomb defense,
 * cryptographic storage naming, and path traversal protection.
 *
 * GOVERNANCE:
 * - Never trusts client-supplied MIME types or extensions alone.
 * - Inspects raw binary signatures (magic bytes) for all uploads.
 * - Defensive validation against ZIP bombs and malformed archives for DOCX.
 * - Generates cryptographically random storage keys to prevent predictable names.
 * - Strictly prevents directory traversal (../, ..\, null-bytes, control characters).
 */

import crypto from 'crypto';
import path from 'path';
import { AppError } from './app-error';

export interface ValidatedFile {
  originalFilename: string;
  sanitizedFilename: string;
  storageFilename: string;
  extension: string;
  detectedMimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  buffer: Buffer;
}

export type AllowedDocumentType = 'pdf' | 'jpeg' | 'png' | 'docx';

export interface DocumentTypeDefinition {
  type: AllowedDocumentType;
  extensions: string[];
  mimeTypes: string[];
  description: string;
}

export const ALLOWED_DOCUMENT_TYPES: Record<AllowedDocumentType, DocumentTypeDefinition> = {
  pdf: {
    type: 'pdf',
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    description: 'Adobe Portable Document Format (PDF)',
  },
  jpeg: {
    type: 'jpeg',
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg'],
    description: 'JPEG Image',
  },
  png: {
    type: 'png',
    extensions: ['png'],
    mimeTypes: ['image/png'],
    description: 'PNG Image',
  },
  docx: {
    type: 'docx',
    extensions: ['docx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/zip',
      'application/x-zip-compressed',
    ],
    description: 'Microsoft Word Document (Office Open XML)',
  },
};

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'bin', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'com', 'scr',
  'js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs', 'json', 'py', 'rb', 'php', 'phtml',
  'html', 'htm', 'xhtml', 'shtml', 'svg', 'xml', 'jar', 'war', 'ear', 'msi',
  'zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'iso', 'img', 'lnk', 'inf', 'reg',
]);

const MAX_DOCX_ENTRIES = 500;
const MAX_DOCX_DECOMPRESSED_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_DOCX_COMPRESSION_RATIO = 20;

/**
 * Sanitizes an untrusted client filename, stripping all paths, null bytes, and control characters.
 */
export function sanitizeOriginalFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== 'string') {
    return 'document_upload';
  }

  // Remove null bytes and control characters
  let clean = rawFilename.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');

  // Normalize Unicode
  clean = clean.normalize('NFC');

  // Strip path traversal sequences repeatedly
  clean = clean.replace(/(\.\.[\/\\])+/g, '');

  // Extract base filename only
  clean = path.basename(clean.replace(/\\/g, '/'));

  // Replace suspicious characters
  clean = clean.replace(/[^a-zA-Z0-9._\-\s]/g, '_').trim();

  if (clean.length === 0 || clean === '.' || clean === '..') {
    clean = 'document_upload';
  }

  // Truncate to maximum 255 characters preserving extension if possible
  if (clean.length > 255) {
    const ext = path.extname(clean);
    const base = path.basename(clean, ext).slice(0, 255 - ext.length);
    clean = base + ext;
  }

  return clean;
}

/**
 * Detects the file type by inspecting magic byte signatures in the raw binary buffer.
 */
export function detectMagicBytes(buffer: Buffer): AllowedDocumentType | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // 1. PDF Signature: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'pdf';
  }

  // 2. JPEG Signature: 0xFF 0xD8 0xFF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // 3. PNG Signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // 4. ZIP container signature (PK\x03\x04): 0x50 0x4B 0x03 0x04
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'docx';
  }

  return null;
}

/**
 * Validates a DOCX file's internal ZIP package structure and enforces zip-bomb defenses.
 * Inspects entry headers in memory without extracting anything to disk.
 */
export function validateDocxPackage(buffer: Buffer): { valid: boolean; error?: string } {
  // Must have standard ZIP local file header signature: PK\x03\x04
  if (buffer.length < 30 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    return { valid: false, error: 'File is not a valid ZIP container' };
  }

  let offset = 0;
  let entryCount = 0;
  let totalUncompressedSize = 0;
  let totalCompressedSize = 0;
  const entryNames: string[] = [];

  try {
    while (offset + 30 <= buffer.length) {
      // Check for local file header signature: 0x04034b50 (PK\x03\x04)
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        entryCount++;
        if (entryCount > MAX_DOCX_ENTRIES) {
          return {
            valid: false,
            error: `DOCX package exceeds entry count limit (${MAX_DOCX_ENTRIES} entries)`,
          };
        }

        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const filenameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        totalCompressedSize += compressedSize;
        totalUncompressedSize += uncompressedSize;

        if (totalUncompressedSize > MAX_DOCX_DECOMPRESSED_BYTES) {
          return {
            valid: false,
            error: `DOCX package exceeds total decompressed size limit (${MAX_DOCX_DECOMPRESSED_BYTES / 1024 / 1024}MB)`,
          };
        }

        const filenameStart = offset + 30;
        const filenameEnd = filenameStart + filenameLength;

        if (filenameEnd <= buffer.length) {
          const entryName = buffer.toString('utf8', filenameStart, filenameEnd);
          entryNames.push(entryName);
        }

        // Jump to next local header
        offset = filenameEnd + extraFieldLength + compressedSize;
      } else if (
        // Central directory file header (0x02014b50 / PK\x01\x02) or End of central dir (0x06054b50 / PK\x05\x06)
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b
      ) {
        // Reached central directory
        break;
      } else {
        // Non-standard byte stream
        offset++;
      }
    }
  } catch {
    return { valid: false, error: 'Malformed or corrupt ZIP structure in DOCX file' };
  }

  // Check compression ratio
  const safeCompressed = Math.max(totalCompressedSize, 1);
  const ratio = totalUncompressedSize / safeCompressed;
  if (ratio > MAX_DOCX_COMPRESSION_RATIO && totalUncompressedSize > 1024 * 1024) {
    return {
      valid: false,
      error: `DOCX package exceeds safe compression ratio (${ratio.toFixed(1)}:1)`,
    };
  }

  // Verify it contains legitimate Office Open XML files
  const hasContentTypes = entryNames.some((name) => name === '[Content_Types].xml' || name.endsWith('/[Content_Types].xml'));
  const hasWordFolder = entryNames.some((name) => name.startsWith('word/') || name.includes('/word/'));
  const hasRels = entryNames.some((name) => name.startsWith('_rels/') || name.includes('/_rels/'));

  if (!hasContentTypes && !hasWordFolder && !hasRels) {
    return {
      valid: false,
      error: 'Uploaded file is a ZIP archive, but lacks legitimate Office Open XML Word document structures',
    };
  }

  return { valid: true };
}

/**
 * Validates an uploaded file buffer against security allowlists, magic bytes, and size limits.
 */
export function validateUploadedDocument(
  file: Express.Multer.File,
  options: {
    maxFileSizeBytes: number;
  }
): ValidatedFile {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new AppError('Uploaded document file is empty or corrupted.', 400, 'FILE_EMPTY');
  }

  // 1. File size check
  if (file.size > options.maxFileSizeBytes || file.buffer.length > options.maxFileSizeBytes) {
    const maxMb = Math.round(options.maxFileSizeBytes / (1024 * 1024));
    throw new AppError(
      `File "${file.originalname}" exceeds the maximum allowed size of ${maxMb}MB.`,
      413,
      'FILE_TOO_LARGE'
    );
  }

  // 2. Sanitize filename
  const sanitized = sanitizeOriginalFilename(file.originalname);
  const rawExt = path.extname(sanitized).toLowerCase().replace(/^\./, '');

  if (!rawExt) {
    throw new AppError(
      `File "${file.originalname}" has no valid file extension.`,
      400,
      'FILE_EXTENSION_MISSING'
    );
  }

  // 3. Dangerous extension check
  if (DANGEROUS_EXTENSIONS.has(rawExt)) {
    throw new AppError(
      `File type .${rawExt} is prohibited for security reasons.`,
      400,
      'FILE_TYPE_PROHIBITED'
    );
  }

  // 4. Magic bytes detection
  const detectedType = detectMagicBytes(file.buffer);
  if (!detectedType) {
    throw new AppError(
      `File "${file.originalname}" does not match any accepted document signature (PDF, JPEG, PNG, DOCX).`,
      415,
      'UNSUPPORTED_MEDIA_TYPE'
    );
  }

  const typeDef = ALLOWED_DOCUMENT_TYPES[detectedType];

  // 5. Extension must match detected type
  if (!typeDef.extensions.includes(rawExt)) {
    throw new AppError(
      `File extension .${rawExt} does not match actual file contents (${typeDef.description}).`,
      400,
      'FILE_EXTENSION_MISMATCH'
    );
  }

  // 6. DOCX deep structure and zip-bomb check
  if (detectedType === 'docx') {
    const docxCheck = validateDocxPackage(file.buffer);
    if (!docxCheck.valid) {
      throw new AppError(
        `Invalid Word document: ${docxCheck.error || 'structural validation failed'}`,
        400,
        'INVALID_DOCX_PACKAGE'
      );
    }
  }

  // 7. Generate cryptographically random storage filename
  const storageId = crypto.randomUUID();
  const canonicalExt = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const storageFilename = `${storageId}.${canonicalExt}`;

  // 8. Compute SHA-256 hash
  const sha256Hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // Determine canonical MIME type
  const canonicalMimeType =
    detectedType === 'pdf'
      ? 'application/pdf'
      : detectedType === 'jpeg'
      ? 'image/jpeg'
      : detectedType === 'png'
      ? 'image/png'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return {
    originalFilename: file.originalname,
    sanitizedFilename: sanitized,
    storageFilename,
    extension: canonicalExt,
    detectedMimeType: canonicalMimeType,
    sizeBytes: file.buffer.length,
    sha256Hash,
    buffer: file.buffer,
  };
}
