/**
 * CITYLINE CONSULTANCY — User-Agent & Analytics Sanitization Utilities
 * Privacy-preserving extraction of device category, browser, operating system, and sanitized referrers.
 *
 * GOVERNANCE:
 * - Zero external analytics dependencies.
 * - Strip sensitive search queries and auth tokens from referrers.
 * - Never store raw identifiable personal information.
 */

import crypto from 'crypto';

export interface DeviceMetadata {
  deviceCategory: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

/**
 * Extracts privacy-safe, high-level device, browser, and OS categories from User-Agent string.
 */
export function parseUserAgent(ua?: string | null): DeviceMetadata {
  if (!ua || typeof ua !== 'string') {
    return {
      deviceCategory: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  // 1. Device Category
  let deviceCategory: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua)) {
    deviceCategory = 'tablet';
  } else if (/(mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop)/i.test(ua)) {
    deviceCategory = 'mobile';
  }

  // 2. Browser
  let browser = 'Other';
  if (/edg([ea]|ios)?\//i.test(ua)) {
    browser = 'Edge';
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  // 3. Operating System
  let os = 'Other';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return {
    deviceCategory,
    browser,
    os,
  };
}

/**
 * Sanitizes incoming referrer into a privacy-safe source label or clean hostname.
 * Strips all search queries, fragments, and user tokens.
 */
export function sanitizeReferrer(referrer?: string | null): string {
  if (!referrer || typeof referrer !== 'string') {
    return 'Direct';
  }

  const trimmed = referrer.trim();
  if (!trimmed) return 'Direct';

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.includes('google')) return 'Google';
    if (host.includes('bing')) return 'Bing';
    if (host.includes('yahoo')) return 'Yahoo';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('citylineconsultancy.ae') || host === 'localhost' || host === '127.0.0.1') return 'Direct';

    return host.replace(/^www\./, '').slice(0, 100);
  } catch {
    return trimmed.replace(/[^\w.-]/g, '').slice(0, 100) || 'Direct';
  }
}

/**
 * Normalizes and sanitizes root-relative pathnames.
 * Strips query strings, hashes, and ensures single leading slash.
 */
export function sanitizePathname(rawPath: string): string {
  let p = (rawPath || '/').trim();

  // Strip query string and fragment
  const qIdx = p.indexOf('?');
  if (qIdx !== -1) p = p.slice(0, qIdx);
  const hIdx = p.indexOf('#');
  if (hIdx !== -1) p = p.slice(0, hIdx);

  // Normalize multi-slashes
  p = p.replace(/\/+/g, '/');

  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }

  return p.slice(0, 255);
}

/**
 * Derives a deterministic cryptographic hash from the client session identifier.
 */
export function computeSessionHash(sessionId: string): string {
  return crypto.createHash('sha256').update(`clc_analytics:${sessionId}`).digest('hex');
}
