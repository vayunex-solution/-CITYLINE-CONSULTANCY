"use strict";
/**
 * CITYLINE CONSULTANCY — Database Error Normalization
 * Translates low-level MariaDB, mysql2, and Knex errors into safe, structured AppErrors.
 *
 * CRITICAL SECURITY GUARANTEE:
 * - Never leaks SQL statements, bindings, table structures, column names, or credentials to API clients.
 * - Logs original technical details server-side safely.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDatabaseError = normalizeDatabaseError;
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
function normalizeDatabaseError(error, context) {
    // If already an application operational error, preserve it
    if (error instanceof app_error_1.AppError) {
        return error;
    }
    const err = error;
    const code = err.code || '';
    const errno = err.errno;
    // Log detailed technical information server-side (redacting credentials and bindings)
    logger_1.logger.error(`Database Exception [${code || errno || 'UNKNOWN'}]: ${context ? `[Context: ${context}] ` : ''}${err.message || 'Unknown database error'}`, error instanceof Error ? error : undefined, {
        dbErrorCode: code,
        dbErrno: errno,
        sqlState: err.sqlState,
        context,
    });
    // 1. Duplicate Unique Key Violation
    if (code === 'ER_DUP_ENTRY' || errno === 1062) {
        return app_error_1.AppError.conflict('A record with the specified unique information already exists.', 'DUPLICATE_RECORD');
    }
    // 2. Foreign Key Constraint Violation (Parent does not exist)
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW' || errno === 1452) {
        return app_error_1.AppError.badRequest('Referenced entity does not exist.', 'FOREIGN_KEY_VIOLATION');
    }
    // 3. Foreign Key Constraint Violation (Child records prevent parent modification)
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED' || errno === 1451) {
        return app_error_1.AppError.conflict('Cannot complete operation because the record is referenced by other active entities.', 'RECORD_IN_USE');
    }
    // 4. Data Too Long for Column
    if (code === 'ER_DATA_TOO_LONG' || errno === 1406) {
        return app_error_1.AppError.badRequest('Input value exceeds the maximum allowable length for this field.', 'DATA_TOO_LONG');
    }
    // 5. Connection, Pool Timeout, or Network Failure
    const isConnectionFailure = code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ER_ACCESS_DENIED_ERROR' ||
        code === 'ER_DBACCESS_DENIED_ERROR' ||
        code === 'KnexTimeoutError' ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('timeout'));
    if (isConnectionFailure) {
        return new app_error_1.AppError('Database service is temporarily unavailable. Please try again later.', 503, 'DATABASE_UNAVAILABLE');
    }
    // 6. Generic Database Exception Fallback
    return new app_error_1.AppError('A database error occurred while processing your request.', 500, 'DATABASE_ERROR');
}
