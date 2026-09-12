/**
 * CITYLINE CONSULTANCY — Database Error Normalization
 * Translates low-level MariaDB, mysql2, and Knex errors into safe, structured AppErrors.
 *
 * CRITICAL SECURITY GUARANTEE:
 * - Never leaks SQL statements, bindings, table structures, column names, or credentials to API clients.
 * - Logs original technical details server-side safely.
 */

import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export interface MySqlErrorLike {
  code?: string;
  errno?: number;
  sqlState?: string;
  message?: string;
  sql?: string;
}

export function normalizeDatabaseError(error: unknown, context?: string): AppError {
  // If already an application operational error, preserve it
  if (error instanceof AppError) {
    return error;
  }

  const err = error as MySqlErrorLike;
  const code = err.code || '';
  const errno = err.errno;

  // Log detailed technical information server-side (redacting credentials and bindings)
  logger.error(
    `Database Exception [${code || errno || 'UNKNOWN'}]: ${context ? `[Context: ${context}] ` : ''}${err.message || 'Unknown database error'}`,
    error instanceof Error ? error : undefined,
    {
      dbErrorCode: code,
      dbErrno: errno,
      sqlState: err.sqlState,
      context,
    }
  );

  // 1. Duplicate Unique Key Violation
  if (code === 'ER_DUP_ENTRY' || errno === 1062) {
    return AppError.conflict(
      'A record with the specified unique information already exists.',
      'DUPLICATE_RECORD'
    );
  }

  // 2. Foreign Key Constraint Violation (Parent does not exist)
  if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW' || errno === 1452) {
    return AppError.badRequest(
      'Referenced entity does not exist.',
      'FOREIGN_KEY_VIOLATION'
    );
  }

  // 3. Foreign Key Constraint Violation (Child records prevent parent modification)
  if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED' || errno === 1451) {
    return AppError.conflict(
      'Cannot complete operation because the record is referenced by other active entities.',
      'RECORD_IN_USE'
    );
  }

  // 4. Data Too Long for Column
  if (code === 'ER_DATA_TOO_LONG' || errno === 1406) {
    return AppError.badRequest(
      'Input value exceeds the maximum allowable length for this field.',
      'DATA_TOO_LONG'
    );
  }

  // 5. Connection, Pool Timeout, or Network Failure
  const isConnectionFailure =
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    code === 'ER_DBACCESS_DENIED_ERROR' ||
    code === 'KnexTimeoutError' ||
    (typeof err.message === 'string' && err.message.toLowerCase().includes('timeout'));

  if (isConnectionFailure) {
    return new AppError(
      'Database service is temporarily unavailable. Please try again later.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }

  // 6. Generic Database Exception Fallback
  return new AppError(
    'A database error occurred while processing your request.',
    500,
    'DATABASE_ERROR'
  );
}
