/**
 * CITYLINE CONSULTANCY — API Standard Contract Types
 * Defines uniform JSON response envelopes and pagination metadata.
 */
export interface ApiResponse<T = unknown> {
    success: true;
    data: T;
    timestamp: string;
    requestId?: string;
}
export interface ApiErrorDetail {
    code: string;
    message: string;
    details?: unknown;
}
export interface ApiErrorResponse {
    success: false;
    error: ApiErrorDetail;
    timestamp: string;
    requestId?: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginatedData<T> {
    items: T[];
    pagination: PaginationMeta;
}
export interface HealthResponse {
    status: 'ok';
}
//# sourceMappingURL=api.types.d.ts.map