/**
 * CITYLINE CONSULTANCY — Document Metadata Repository
 * Manages database persistence for the centralized documents metadata table.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';
import { AppError } from '../utils/app-error';

export interface DocumentRecord {
  [key: string]: unknown;
  id: string;
  entity_type: string;
  entity_id: string;
  document_category: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_extension: string;
  file_size_bytes: number;
  file_data?: Buffer | null;
  sha256_hash: string;
  validation_status: string;
  malware_scan_status: string;
  retention_status: string;
  retention_expires_at?: Date | null;
  purged_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class DocumentRepository extends AbstractKnexRepository<DocumentRecord, string> {
  protected readonly tableName = 'documents';

  /**
   * Batch inserts document metadata records within an active transaction.
   */
  public async insertBatch(
    documents: Omit<DocumentRecord, 'created_at' | 'updated_at'>[],
    trx: Knex.Transaction
  ): Promise<void> {
    if (documents.length === 0) return;

    try {
      const rows = documents.map((doc) => ({
        ...doc,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      }));

      await trx('documents').insert(rows);
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'DocumentRepository.insertBatch');
    }
  }

  /**
   * Finds all document records linked to a specific entity.
   */
  public async findByEntity(
    entityType: string,
    entityId: string,
    trx?: Knex.Transaction
  ): Promise<DocumentRecord[]> {
    try {
      const query = this.getQuery(trx);
      const rows = await query
        .where({
          entity_type: entityType,
          entity_id: entityId,
        })
        .orderBy('created_at', 'asc');
      return rows as DocumentRecord[];
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'DocumentRepository.findByEntity');
    }
  }
}

export const documentRepository = new DocumentRepository();

/**
 * Asserts whether a document record meets the authoritative security trust boundary.
 * A document is TRUSTED/ACCEPTED if and only if:
 * 1. `validation_status === 'valid'` (passed binary signature, MIME, and package validation).
 * 2. `malware_scan_status === 'clean'` (authoritatively verified by active malware scanner).
 * Any document with status 'pending', 'skipped', 'scan_failed', or 'infected' is strictly UNTRUSTED.
 */
export function isDocumentTrusted(doc: {
  validation_status: string;
  malware_scan_status: string;
}): boolean {
  return doc.validation_status === 'valid' && doc.malware_scan_status === 'clean';
}

/**
 * Throws an AppError if a document is not in a trusted, fully-scanned state.
 * Used by future document access and retrieval workflows to prevent casual leakage of quarantined documents.
 */
export function assertDocumentTrusted(doc: {
  validation_status: string;
  malware_scan_status: string;
}): void {
  if (!isDocumentTrusted(doc)) {
    throw new AppError(
      'Document cannot be retrieved or accessed because it is quarantined or unverified.',
      403,
      'DOCUMENT_UNTRUSTED'
    );
  }
}
