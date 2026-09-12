/**
 * CITYLINE CONSULTANCY — Frontend API Client Foundation
 * Configures base URL, standard headers, and typed response extraction.
 */

import { ApiResponse, ApiErrorResponse, HealthResponse } from '@cityline/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorPayload = (await res.json()) as ApiErrorResponse;
      throw new Error(errorPayload.error?.message || `HTTP ${res.status}`);
    }

    const payload = (await res.json()) as ApiResponse<HealthResponse>;
    return payload.data;
  }
}

export const apiClient = new ApiClient();
