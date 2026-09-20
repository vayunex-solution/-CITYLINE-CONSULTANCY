/**
 * CITYLINE CONSULTANCY — Centralized Admin API Client
 * Manages authenticated administrative HTTP requests via HttpOnly cookie transport,
 * automatic CSRF token header synchronization, error normalization, and response typing.
 *
 * SECURITY GOVERNANCE:
 * - ZERO auth token storage in localStorage or sessionStorage.
 * - Relies strictly on server-managed HttpOnly cookie (`clc_admin_token`).
 * - Automatically attaches Double-Submit CSRF token (`X-CSRF-Token`) from `clc_csrf_token` cookie.
 * - Credentials included on all requests (`credentials: 'include'`).
 */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: ApiPagination;
  timestamp?: string;
}

export interface NormalizedApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;
}

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('citylineconsultancy.com')) {
    return 'https://api.citylineconsultancy.com/api/v1';
  }
  return '/api/v1';
};

let memoryCsrfToken = '';

export function setMemoryCsrfToken(token: string): void {
  if (token && typeof token === 'string') {
    memoryCsrfToken = token;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('clc_csrf_token', token);
      }
    } catch {}
  }
}

/**
 * Reads the public Double-Submit CSRF cookie value or stored token.
 */
export function getCsrfToken(): string {
  // 1. Try reading document.cookie
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)clc_csrf_token=([^;]*)/);
    if (match && match[1]) {
      const val = decodeURIComponent(match[1]);
      setMemoryCsrfToken(val);
      return val;
    }
  }

  // 2. Try memory
  if (memoryCsrfToken) return memoryCsrfToken;

  // 3. Try sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('clc_csrf_token');
      if (stored) {
        memoryCsrfToken = stored;
        return stored;
      }
    } catch {}
  }

  // 4. Generate client token if absent
  if (typeof window !== 'undefined' && window.crypto) {
    const fallback = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setMemoryCsrfToken(fallback);
    return fallback;
  }

  return memoryCsrfToken;
}

/**
 * Centralized authenticated fetch client for admin operations.
 */
export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  // Set JSON content-type only when body is not FormData and not already specified
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Double-Submit CSRF protection: attach X-CSRF-Token for state-mutating requests
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(method) && !headers.has('X-CSRF-Token')) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const json = isJson ? await response.json().catch(() => ({})) : {};

    // Cache updated CSRF token if returned by the server
    if (json.data?.csrfToken) {
      setMemoryCsrfToken(json.data.csrfToken);
    }

    if (!response.ok) {
      const errorMsg =
        json.error?.message ||
        json.message ||
        (response.status === 401
          ? 'Session expired or unauthenticated. Please log in.'
          : response.status === 403
          ? 'Access denied. Insufficient administrative privileges.'
          : response.status === 404
          ? 'The requested administrative resource was not found.'
          : response.status === 429
          ? 'Too many requests. Please wait before retrying.'
          : `Request failed with status ${response.status}`);

      const err = new Error(errorMsg) as NormalizedApiError;
      err.status = response.status;
      err.code = json.error?.code || (response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'API_ERROR');
      err.fieldErrors = json.error?.details?.fieldErrors || json.error?.fieldErrors;
      throw err;
    }

    return json as ApiResponse<T>;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Network error: Unable to connect to Cityline Admin API.') as NormalizedApiError;
      networkErr.status = 0;
      networkErr.code = 'NETWORK_ERROR';
      throw networkErr;
    }
    throw err;
  }
}

/**
 * Fetches binary blob data (PDF, documents, images) with administrative session credentials.
 */
export async function adminFetchBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ blob: Blob; filename?: string; contentType?: string }> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(method) && !headers.has('X-CSRF-Token')) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const json = await response.json();
        errorMsg = json.error?.message || json.message || errorMsg;
      } catch {}

      const err = new Error(errorMsg) as NormalizedApiError;
      err.status = response.status;
      err.code = response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'API_ERROR';
      throw err;
    }

    const contentDisposition = response.headers.get('content-disposition');
    let filename: string | undefined;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const contentType = response.headers.get('content-type') || undefined;
    const blob = await response.blob();
    return { blob, filename, contentType };
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Network error: Unable to connect to Cityline Admin API.') as NormalizedApiError;
      networkErr.status = 0;
      networkErr.code = 'NETWORK_ERROR';
      throw networkErr;
    }
    throw err;
  }
}

/**
 * Previews an admin document in a new browser tab or popup.
 */
export async function adminPreviewDocument(documentId: string): Promise<void> {
  // Pre-open new tab synchronously to bypass modern browser popup blockers
  let previewWindow: Window | null = null;
  try {
    previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) {
      previewWindow.document.write(
        '<!DOCTYPE html><html><head><title>Opening Document...</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;}</style></head><body><div style="text-align:center;padding:24px;"><div style="font-size:16px;font-weight:600;margin-bottom:8px;">Securing & Loading Document...</div><div style="font-size:12px;color:#94a3b8;">Cityline Consultancy Document Gateway</div></div></body></html>'
      );
    }
  } catch {
    // Window open blocked or restricted; link fallback will activate below
  }

  try {
    const { blob } = await adminFetchBlob(`/admin/documents/${documentId}/preview`);
    const blobUrl = URL.createObjectURL(blob);

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = blobUrl;
    } else {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 120000);
  } catch (err) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.close();
    }
    throw err;
  }
}

/**
 * Downloads an admin document directly to the client disk.
 */
export async function adminDownloadDocument(documentId: string, fallbackFilename: string = 'document.pdf'): Promise<void> {
  const { blob, filename } = await adminFetchBlob(`/admin/documents/${documentId}/download`);
  const blobUrl = URL.createObjectURL(blob);
  const saveName = filename || fallbackFilename;

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = saveName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 15000);
}
