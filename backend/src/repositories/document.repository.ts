/**
 * CITYLINE CONSULTANCY — Document Metadata Repository
 * Manages database persistence for the centralized documents metadata table.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';

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
