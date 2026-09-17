/**
 * CITYLINE CONSULTANCY — Centralized Public Frontend API Client
 * Configures environment-driven base URL, standard headers, multipart FormData handling,
 * error normalization, and typed response extraction.
 */

import { ApiResponse, HealthResponse } from '@cityline/shared';

export interface ApiClientError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export function getPublicApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  // In production browser, route directly to the backend subdomain
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('citylineconsultancy.com')) {
      return 'https://api.citylineconsultancy.com/api/v1';
    }
    return '/api/v1';
  }
  return process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/v1` : 'http://127.0.0.1:5000/api/v1';
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = getPublicApiBaseUrl()) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Universal fetch helper for public endpoints with JSON and FormData handling.
   */
  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${normalizedEndpoint}`;

    const headers = new Headers(options.headers || {});

    // Automatically set Content-Type to application/json UNLESS body is FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        const errorMsg =
          data.error?.message ||
          data.message ||
          (res.status === 400
            ? 'Validation error in request.'
            : res.status === 404
            ? 'Requested resource not found.'
            : res.status === 413
            ? 'Upload payload exceeds size limit.'
            : res.status === 429
            ? 'Too many requests. Please retry later.'
            : `Request failed with HTTP ${res.status}`);

        const error = new Error(errorMsg) as ApiClientError;
        error.status = res.status;
        error.code = data.error?.code || 'API_ERROR';
        error.fieldErrors = data.error?.details?.fieldErrors || data.error?.fieldErrors;
        throw error;
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const netErr = new Error('Network error. Unable to contact service.') as ApiClientError;
        netErr.status = 0;
        netErr.code = 'NETWORK_ERROR';
        throw netErr;
      }
      throw err;
    }
  }

  public async getHealth(): Promise<HealthResponse> {
    const payload = await this.request<HealthResponse>('/health');
    return payload.data;
  }
}

export const apiClient = new ApiClient();
