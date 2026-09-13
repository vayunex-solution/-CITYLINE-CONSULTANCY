/**
 * CITYLINE CONSULTANCY — Document Security Unit Test Suite
 * Validates magic-byte detection, MIME allowlisting, path traversal blocking,
 * cryptographic storage key generation, and DOCX zip-bomb defense.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  detectMagicBytes,
  sanitizeOriginalFilename,
  validateDocxPackage,
  validateUploadedDocument,
  ALLOWED_DOCUMENT_TYPES,
} from '../src/utils/file-security';
import { AppError } from '../src/utils/app-error';

// Helper to construct in-memory ZIP archive buffers for DOCX testing
function createMockZipBuffer(
  files: {
    name: string;
    content?: string;
    compressedSize?: number;
    uncompressedSize?: number;
  }[]
): Buffer {
  const chunks: Buffer[] = [];
  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const contentBuf = Buffer.from(file.content || '<xml></xml>', 'utf8');
    const compSize = file.compressedSize !== undefined ? file.compressedSize : contentBuf.length;
    const uncompSize = file.uncompressedSize !== undefined ? file.uncompressedSize : contentBuf.length;

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // compression method (stored)
    header.writeUInt32LE(0, 10); // time/date
    header.writeUInt32LE(0, 14); // crc
    header.writeUInt32LE(compSize, 18);
    header.writeUInt32LE(uncompSize, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28); // extra field length

    chunks.push(header);
    chunks.push(nameBuf);
    chunks.push(contentBuf);
  }

  // End with central directory header: PK\x01\x02
  chunks.push(Buffer.from([0x50, 0x4b, 0x01, 0x02, 0, 0, 0, 0]));
  return Buffer.concat(chunks);
}

describe('Document Security Engine', () => {
  describe('Magic Byte Signature Detection', () => {
    it('accurately identifies Adobe PDF (%PDF-)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.7 header content here');
      assert.strictEqual(detectMagicBytes(pdfBuffer), 'pdf');
    });

    it('accurately identifies JPEG (0xFF 0xD8 0xFF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      assert.strictEqual(detectMagicBytes(jpegBuffer), 'jpeg');
    });

    it('accurately identifies PNG (0x89 PNG\\r\\n\\x1a\\n)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      assert.strictEqual(detectMagicBytes(pngBuffer), 'png');
    });

    it('accurately identifies ZIP container (PK\\x03\\x04)', () => {
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      assert.strictEqual(detectMagicBytes(zipBuffer), 'docx');
    });

    it('rejects arbitrary plain text or executable signatures', () => {
      assert.strictEqual(detectMagicBytes(Buffer.from('Hello world plain text')), null);
      assert.strictEqual(detectMagicBytes(Buffer.from('MZ\x90\x00 (Windows Executable)')), null);
      assert.strictEqual(detectMagicBytes(Buffer.from('#!/bin/bash')), null);
      assert.strictEqual(detectMagicBytes(Buffer.from('<?php echo "evil"; ?>')), null);
      assert.strictEqual(detectMagicBytes(Buffer.from('')), null);
    });
  });

  describe('Filename Sanitization & Path Traversal Defense', () => {
    it('strips directory traversal sequences (../ and ..\\)', () => {
      assert.strictEqual(
        sanitizeOriginalFilename('../../../etc/passwd.pdf'),
        'passwd.pdf'
      );
      assert.strictEqual(
        sanitizeOriginalFilename('..\\..\\Windows\\System32\\cmd.exe'),
        'cmd.exe'
      );
      assert.strictEqual(
        sanitizeOriginalFilename('folder/../../secret.pdf'),
        'secret.pdf'
      );
    });

    it('strips null bytes and control characters', () => {
      assert.strictEqual(
        sanitizeOriginalFilename('passport\0.pdf\0.exe'),
        'passport.pdf.exe'
      );
      assert.strictEqual(
        sanitizeOriginalFilename('file\x01\x02\x1Fname.pdf'),
        'filename.pdf'
      );
    });

    it('handles empty or special path filenames safely', () => {
      assert.strictEqual(sanitizeOriginalFilename(''), 'document_upload');
      assert.strictEqual(sanitizeOriginalFilename('.'), 'document_upload');
      assert.strictEqual(sanitizeOriginalFilename('..'), 'document_upload');
      assert.strictEqual(sanitizeOriginalFilename('   '), 'document_upload');
    });

    it('preserves valid characters and normalizes Unicode', () => {
      const clean = sanitizeOriginalFilename('Passport_Copy-2026.pdf');
      assert.strictEqual(clean, 'Passport_Copy-2026.pdf');
    });
  });

  describe('DOCX Package Validation & Zip-Bomb Defense', () => {
    it('accepts legitimate Office Open XML structure', () => {
      const docxBuffer = createMockZipBuffer([
        { name: '[Content_Types].xml', content: '<?xml version="1.0"?><Types/>' },
        { name: 'word/document.xml', content: '<?xml version="1.0"?><w:document/>' },
      ]);

      const result = validateDocxPackage(docxBuffer);
      assert.strictEqual(result.valid, true);
    });

    it('rejects arbitrary non-Office ZIP archives disguised as .docx', () => {
      const nonOfficeZip = createMockZipBuffer([
        { name: 'script.py', content: 'print("arbitrary zip")' },
        { name: 'payload.sh', content: 'rm -rf /' },
      ]);

      const result = validateDocxPackage(nonOfficeZip);
      assert.strictEqual(result.valid, false);
      assert.match(result.error || '', /lacks legitimate Office Open XML/);
    });

    it('rejects ZIP containers with excessive entry count (>500)', () => {
      const excessiveEntries: { name: string; content: string }[] = [];
      for (let i = 0; i < 505; i++) {
        excessiveEntries.push({ name: `word/entry_${i}.xml`, content: '<data/>' });
      }
      const bombBuffer = createMockZipBuffer(excessiveEntries);

      const result = validateDocxPackage(bombBuffer);
      assert.strictEqual(result.valid, false);
      assert.match(result.error || '', /exceeds entry count limit/);
    });

    it('rejects ZIP packages with excessive decompressed size (>50MB)', () => {
      const giantBuffer = createMockZipBuffer([
        {
          name: '[Content_Types].xml',
          content: '<xml/>',
          compressedSize: 100,
          uncompressedSize: 55 * 1024 * 1024, // 55MB declared uncompressed
        },
      ]);

      const result = validateDocxPackage(giantBuffer);
      assert.strictEqual(result.valid, false);
      assert.match(result.error || '', /exceeds total decompressed size limit/);
    });

    it('rejects packages with suspicious compression ratio (>20:1)', () => {
      const ratioBombBuffer = createMockZipBuffer([
        {
          name: '[Content_Types].xml',
          content: '<xml/>',
          compressedSize: 1000,
          uncompressedSize: 25 * 1000 * 1000, // ~25:1 ratio > 1MB
        },
      ]);

      const result = validateDocxPackage(ratioBombBuffer);
      assert.strictEqual(result.valid, false);
      assert.match(result.error || '', /exceeds safe compression ratio/);
    });

    it('rejects corrupted or truncated ZIP buffers', () => {
      const corrupt = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02]);
      const result = validateDocxPackage(corrupt);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('Comprehensive Document Upload Validation (validateUploadedDocument)', () => {
    const defaultOptions = { maxFileSizeBytes: 10 * 1024 * 1024 };

    it('successfully validates a genuine PDF document', () => {
      const pdfBuffer = Buffer.from('%PDF-1.7 mock genuine pdf bytes for applicant');
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'my_passport.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: pdfBuffer,
        stream: null as any,
      };

      const validated = validateUploadedDocument(file, defaultOptions);

      assert.strictEqual(validated.originalFilename, 'my_passport.pdf');
      assert.strictEqual(validated.sanitizedFilename, 'my_passport.pdf');
      assert.strictEqual(validated.extension, 'pdf');
      assert.strictEqual(validated.detectedMimeType, 'application/pdf');
      assert.strictEqual(validated.sizeBytes, pdfBuffer.length);
      assert.strictEqual(
        validated.sha256Hash,
        crypto.createHash('sha256').update(pdfBuffer).digest('hex')
      );
      // Cryptographically random storage key
      assert.match(validated.storageFilename, /^[0-9a-f-]{36}\.pdf$/);
      assert.notStrictEqual(validated.storageFilename, 'my_passport.pdf');
    });

    it('successfully validates a genuine JPEG image', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: jpegBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: jpegBuffer,
        stream: null as any,
      };

      const validated = validateUploadedDocument(file, defaultOptions);
      assert.strictEqual(validated.extension, 'jpg');
      assert.strictEqual(validated.detectedMimeType, 'image/jpeg');
      assert.match(validated.storageFilename, /^[0-9a-f-]{36}\.jpg$/);
    });

    it('successfully validates a genuine PNG image', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'scan.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: pngBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: pngBuffer,
        stream: null as any,
      };

      const validated = validateUploadedDocument(file, defaultOptions);
      assert.strictEqual(validated.extension, 'png');
      assert.strictEqual(validated.detectedMimeType, 'image/png');
      assert.match(validated.storageFilename, /^[0-9a-f-]{36}\.png$/);
    });

    it('successfully validates a genuine DOCX document', () => {
      const docxBuffer = createMockZipBuffer([
        { name: '[Content_Types].xml', content: '<Types/>' },
        { name: 'word/document.xml', content: '<w:document/>' },
      ]);
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'resume.docx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: docxBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: docxBuffer,
        stream: null as any,
      };

      const validated = validateUploadedDocument(file, defaultOptions);
      assert.strictEqual(validated.extension, 'docx');
      assert.strictEqual(
        validated.detectedMimeType,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      assert.match(validated.storageFilename, /^[0-9a-f-]{36}\.docx$/);
    });

    it('rejects prohibited file extensions (.exe, .sh, .bat, .php, .svg)', () => {
      const testCases = ['evil.exe', 'script.sh', 'shell.php', 'vector.svg', 'run.bat'];

      for (const dangerousName of testCases) {
        const file: Express.Multer.File = {
          fieldname: 'documents',
          originalname: dangerousName,
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          size: 100,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from('%PDF-1.7 fake payload'),
          stream: null as any,
        };

        assert.throws(
          () => validateUploadedDocument(file, defaultOptions),
          (err: unknown) => {
            assert.ok(err instanceof AppError);
            assert.strictEqual(err.code, 'FILE_TYPE_PROHIBITED');
            return true;
          }
        );
      }
    });

    it('rejects files with magic-byte mismatch (e.g. text disguised as PDF)', () => {
      const fakePdfBuffer = Buffer.from('This is plain text pretending to be a PDF');
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'passport.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: fakePdfBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: fakePdfBuffer,
        stream: null as any,
      };

      assert.throws(
        () => validateUploadedDocument(file, defaultOptions),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'UNSUPPORTED_MEDIA_TYPE');
          return true;
        }
      );
    });

    it('rejects extension mismatch (e.g. JPEG file named .pdf)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'image_renamed.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: jpegBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: jpegBuffer,
        stream: null as any,
      };

      assert.throws(
        () => validateUploadedDocument(file, defaultOptions),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'FILE_EXTENSION_MISMATCH');
          return true;
        }
      );
    });

    it('rejects files exceeding maximum file size limit', () => {
      const largeBuffer = Buffer.alloc(1024 * 1024 + 10);
      largeBuffer.set(Buffer.from('%PDF-1.7'), 0);

      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'huge.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: largeBuffer.length,
        destination: '',
        filename: '',
        path: '',
        buffer: largeBuffer,
        stream: null as any,
      };

      // 1MB limit for this test
      assert.throws(
        () => validateUploadedDocument(file, { maxFileSizeBytes: 1024 * 1024 }),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'FILE_TOO_LARGE');
          return true;
        }
      );
    });

    it('rejects empty or missing buffers', () => {
      const file: Express.Multer.File = {
        fieldname: 'documents',
        originalname: 'empty.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 0,
        destination: '',
        filename: '',
        path: '',
        buffer: Buffer.alloc(0),
        stream: null as any,
      };

      assert.throws(
        () => validateUploadedDocument(file, defaultOptions),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'FILE_EMPTY');
          return true;
        }
      );
    });
  });
});
