"use strict";
/**
 * CITYLINE CONSULTANCY — Document Metadata Repository
 * Manages database persistence for the centralized documents metadata table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRepository = exports.DocumentRepository = void 0;
exports.isDocumentTrusted = isDocumentTrusted;
exports.assertDocumentTrusted = assertDocumentTrusted;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
const app_error_1 = require("../utils/app-error");
class DocumentRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'documents';
    /**
     * Batch inserts document metadata records within an active transaction.
     */
    async insertBatch(documents, trx) {
        if (documents.length === 0)
            return;
        try {
            const rows = documents.map((doc) => ({
                ...doc,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            }));
            await trx('documents').insert(rows);
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'DocumentRepository.insertBatch');
        }
    }
    /**
     * Finds all document records linked to a specific entity.
     */
    async findByEntity(entityType, entityId, trx) {
        try {
            const query = this.getQuery(trx);
            const rows = await query
                .where({
                entity_type: entityType,
                entity_id: entityId,
            })
                .orderBy('created_at', 'asc');
            return rows;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'DocumentRepository.findByEntity');
        }
    }
}
exports.DocumentRepository = DocumentRepository;
exports.documentRepository = new DocumentRepository();
/**
 * Asserts whether a document record meets the authoritative security trust boundary.
 * A document is TRUSTED/ACCEPTED if and only if:
 * 1. `validation_status === 'valid'` (passed binary signature, MIME, and package validation).
 * 2. `malware_scan_status === 'clean'` (authoritatively verified by active malware scanner).
 * Any document with status 'pending', 'skipped', 'scan_failed', or 'infected' is strictly UNTRUSTED.
 */
function isDocumentTrusted(doc) {
    return doc.validation_status === 'valid' && doc.malware_scan_status === 'clean';
}
/**
 * Throws an AppError if a document is not in a trusted, fully-scanned state.
 * Used by future document access and retrieval workflows to prevent casual leakage of quarantined documents.
 */
function assertDocumentTrusted(doc) {
    if (!isDocumentTrusted(doc)) {
        throw new app_error_1.AppError('Document cannot be retrieved or accessed because it is quarantined or unverified.', 403, 'DOCUMENT_UNTRUSTED');
    }
}
