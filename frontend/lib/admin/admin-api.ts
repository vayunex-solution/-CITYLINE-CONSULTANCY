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

/**
 * Reads the public Double-Submit CSRF cookie value set by the backend (`clc_csrf_token`).
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)clc_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
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
