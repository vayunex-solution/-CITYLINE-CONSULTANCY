/**
 * CITYLINE CONSULTANCY — Base Repository Interface
 *
 * Architectural contract defining foundational CRUD operations.
 * Concrete implementations (MySQL / Knex / ORM adapter) are implemented in Phase 2
 * once the production database engine has been verified.
 */

export interface BaseRepository<T, TId = string | number> {
  findById(id: TId): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: TId, item: Partial<T>): Promise<T | null>;
  delete(id: TId): Promise<boolean>;
}
