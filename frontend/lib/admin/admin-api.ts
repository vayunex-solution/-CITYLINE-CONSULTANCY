/**
 * CITYLINE CONSULTANCY — Centralized Admin API Client
 * Manages authenticated administrative HTTP requests, token attachment,
 * error normalization, and response typing.
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

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
};

export const getStoredAdminToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('clc_admin_token') || '';
};

export const setStoredAdminToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('clc_admin_token', token);
  } else {
    localStorage.removeItem('clc_admin_token');
  }
};

export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = getStoredAdminToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
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
      const errorMsg = json.error?.message || json.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as Error & { status: number; code?: string; fieldErrors?: any };
      err.status = response.status;
      err.code = json.error?.code || 'API_ERROR';
      err.fieldErrors = json.error?.details?.fieldErrors;
      throw err;
    }

    return json as ApiResponse<T>;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Network error. Unable to connect to Cityline Admin API.') as Error & { status: number };
      networkErr.status = 0;
      throw networkErr;
    }
    throw err;
  }
}
