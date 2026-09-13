/**
 * CITYLINE CONSULTANCY — Admin Authentication Token & CSRF Service
 * Manages signed stateless JWT access tokens, cryptographic CSRF tokens, and secure cookie configurations.
 *
 * GOVERNANCE:
 * - Transport: HttpOnly, Secure (in production), SameSite=Lax cookie.
 * - Storage: Inaccessible to JavaScript (never stored in localStorage).
 * - CSRF: Double-Submit pattern using separate non-HttpOnly readable cookie.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { AdminRole } from '@cityline/shared';
import { env } from '../config/env.config';
import { tokenRevocationStore } from './token-revocation';

export interface AdminTokenPayloadInput {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  roleId: number;
}

export interface AdminTokenClaims {
  sub: string;
  username: string;
  email: string;
  role: AdminRole;
  roleId: number;
  jti: string;
  iat: number;
  exp: number;
}

/**
 * Creates a signed JWT access token for an authenticated administrator.
 */
export function createAdminToken(admin: AdminTokenPayloadInput): { token: string; jti: string; exp: number } {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      roleId: admin.roleId,
      jti,
    },
    env.AUTH_TOKEN_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.AUTH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    }
  );

  const decoded = jwt.decode(token) as { exp: number };

  return {
    token,
    jti,
    exp: decoded.exp,
  };
}

/**
 * Verifies a candidate JWT access token.
 * Returns decoded claims if valid and not revoked; returns null otherwise.
 */
export function verifyAdminToken(token: string): AdminTokenClaims | null {
  if (!token) return null;

  try {
    const claims = jwt.verify(token, env.AUTH_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as AdminTokenClaims;

    // Reject immediately if token identifier is in the revocation blacklist
    if (tokenRevocationStore.isRevoked(claims.jti)) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically strong 32-byte hexadecimal CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compares incoming CSRF token from header with the cookie value using constant-time comparison.
 */
export function verifyCsrfToken(cookieToken?: string, headerToken?: string): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    return false;
  }

  const bufCookie = Buffer.from(cookieToken);
  const bufHeader = Buffer.from(headerToken);

  if (bufCookie.length !== bufHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufCookie, bufHeader);
}

/**
 * Returns standard Express cookie options for the administrative auth token.
 */
export function getAuthCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs ?? 30 * 60 * 1000, // Default 30 minutes
  };
}

/**
 * Returns standard Express cookie options for the readable CSRF token.
 */
export function getCsrfCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: false, // Must be readable by client JS to set X-CSRF-Token header
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs ?? 30 * 60 * 1000,
  };
}
