/**
 * CITYLINE CONSULTANCY — Express Type Augmentation
 * Extends Express Request with typed correlation/request ID.
 */

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export {};
