/**
 * CITYLINE CONSULTANCY — Token Revocation Subsystem
 * Tracks revoked JWT identifiers (jti) in-memory until their natural expiration.
 *
 * GOVERNANCE:
 * - Evicts expired revocation entries periodically to bound memory usage.
 * - Used during administrative logout and emergency credential invalidation.
 */

class TokenRevocationStore {
  private revokedTokens = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.purgeExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Adds a token's jti to the revocation blacklist.
   */
  public revoke(jti: string, expiresAt: number): void {
    if (!jti) return;
    this.revokedTokens.set(jti, expiresAt);
  }

  /**
   * Checks if a jti is in the revocation blacklist.
   */
  public isRevoked(jti: string): boolean {
    if (!jti) return true;
    const expiresAt = this.revokedTokens.get(jti);
    if (!expiresAt) return false;

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      this.revokedTokens.delete(jti);
      return false;
    }
    return true;
  }

  /**
   * Purges expired revocation records.
   */
  public purgeExpired(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, expiresAt] of this.revokedTokens.entries()) {
      if (now > expiresAt) {
        this.revokedTokens.delete(jti);
      }
    }
  }

  /**
   * Resets the revocation store (used in test teardown).
   */
  public clear(): void {
    this.revokedTokens.clear();
  }

  public size(): number {
    return this.revokedTokens.size;
  }
}

export const tokenRevocationStore = new TokenRevocationStore();
