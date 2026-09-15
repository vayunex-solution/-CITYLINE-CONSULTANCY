/**
 * CITYLINE CONSULTANCY — Client Analytics Tracker Utility
 * Privacy-preserving first-party page-view beacon for the public website.
 *
 * GOVERNANCE:
 * - Anonymous first-party session identifier stored in client storage.
 * - Non-blocking: Uses fetch with keepalive.
 * - Fail-safe: Errors never affect navigation or UI.
 * - Strictly no PII, keystrokes, form fields, or document data transmitted.
 */

const SESSION_STORAGE_KEY = 'clc_anon_vid';

/**
 * Retrieves existing or generates a new anonymous session UUID for first-party tracking.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    // If storage is disabled (e.g. strict incognito), generate an ephemeral identifier
    return 'anon-' + Math.random().toString(36).slice(2, 18);
  }
}

/**
 * Dispatches a lightweight page-view beacon to the backend ingestion endpoint.
 */
export async function recordPageView(pathname: string): Promise<void> {
  if (typeof window === 'undefined' || !pathname) {
    return;
  }

  try {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const endpoint = `${apiUrl}/analytics/page-view`;

    const payload = {
      sessionId,
      pathname,
      referrer: document.referrer || null,
    };

    // Non-blocking fetch
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    });
  } catch {
    // Fail silently: analytics must NEVER interrupt the visitor experience
  }
}
