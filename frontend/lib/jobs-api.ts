/**
 * CITYLINE CONSULTANCY — Jobs API Client
 * Connects frontend components to the authoritative backend Jobs & Recruitment endpoints (/api/v1/jobs).
 */

import { SEED_JOBS, getJobBySlug as getSeedJobBySlug } from './data/jobs';
import { JobOpportunity } from './types/website.types';
import { getPublicApiBaseUrl } from './api-client';

export interface JobsListResponse {
  jobs: JobOpportunity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isBackendData: boolean;
}

export interface JobDetailResponse {
  job: JobOpportunity;
  relatedJobs: JobOpportunity[];
  isBackendData: boolean;
}

export interface SubmitApplicationResponse {
  success: boolean;
  reference: string;
  message: string;
}

/**
 * Normalizes backend DTO to frontend JobOpportunity interface
 */
function mapBackendJobToOpportunity(dto: any): JobOpportunity {
  return {
    id: dto.id || dto.slug,
    slug: dto.slug,
    title: dto.title,
    category: dto.category || '',
    location: dto.location || 'Dubai, UAE',
    type: dto.employmentType || 'Full-Time',
    overview: dto.shortDescription || dto.description || '',
    responsibilities: dto.responsibilities
      ? typeof dto.responsibilities === 'string'
        ? dto.responsibilities.split('\n').filter((s: string) => s.trim().length > 0)
        : dto.responsibilities
      : [],
    requirements: dto.requirements
      ? typeof dto.requirements === 'string'
        ? dto.requirements.split('\n').filter((s: string) => s.trim().length > 0)
        : dto.requirements
      : [],
    qualification: dto.qualification || undefined,
    experienceYearsRequired: dto.experienceYearsRequired ?? undefined,
    salaryRange: dto.salaryRange || undefined,
    benefits: dto.benefits || undefined,
    isFeatured: Boolean(dto.isFeatured),
    publishedAt: dto.publishedAt || undefined,
  };
}

/**
 * Fetches published jobs from backend API with fallback to local seed data.
 */
export async function fetchPublishedJobs(params: {
  search?: string;
  category?: string;
  location?: string;
  employmentType?: string;
  page?: number;
  limit?: number;
} = {}): Promise<JobsListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.location) query.set('location', params.location);
  if (params.employmentType) query.set('employmentType', params.employmentType);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/jobs?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        return {
          jobs: body.data.map(mapBackendJobToOpportunity),
          total: body.pagination?.total ?? body.data.length,
          page: body.pagination?.page ?? 1,
          limit: body.pagination?.limit ?? (params.limit || 12),
          totalPages: body.pagination?.totalPages ?? 1,
          isBackendData: true,
        };
      }
    }
  } catch {
    // Backend unreachable: fallback gracefully to local seed dataset
  }

  // Filter seed jobs locally
  let filtered = [...SEED_JOBS];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.overview.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }
  if (params.category) {
    filtered = filtered.filter(
      (j) => j.category.toLowerCase() === params.category!.toLowerCase()
    );
  }
  if (params.location) {
    filtered = filtered.filter(
      (j) => j.location.toLowerCase().includes(params.location!.toLowerCase())
    );
  }

  const limit = params.limit || 12;
  const page = params.page || 1;
  const total = filtered.length;
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return {
    jobs: sliced,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    isBackendData: false,
  };
}

/**
 * Fetches a single published job by its slug.
 */
export async function fetchJobBySlug(slug: string): Promise<JobDetailResponse | null> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/jobs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const body = await res.json();
      if (body.success && body.data) {
        return {
          job: mapBackendJobToOpportunity(body.data),
          relatedJobs: Array.isArray(body.relatedJobs)
            ? body.relatedJobs.map(mapBackendJobToOpportunity)
            : [],
          isBackendData: true,
        };
      }
    }
  } catch {
    // Fallback
  }

  const fallback = getSeedJobBySlug(slug);
  if (!fallback) return null;

  const related = SEED_JOBS.filter(
    (j) => j.category === fallback.category && j.id !== fallback.id
  ).slice(0, 3);

  return {
    job: fallback,
    relatedJobs: related,
    isBackendData: false,
  };
}

/**
 * Submits candidate application to /api/v1/jobs/:slug/apply
 */
export async function submitJobApplication(
  slug: string,
  formData: FormData,
  idempotencyKey?: string
): Promise<SubmitApplicationResponse> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${getPublicApiBaseUrl()}/jobs/${encodeURIComponent(slug)}/apply`, {
    method: 'POST',
    body: formData,
    headers,
  });

  const body = await res.json();

  if (!res.ok) {
    if (body.error?.fieldErrors) {
      const error: any = new Error(body.error.message || 'Validation failed');
      error.fieldErrors = body.error.fieldErrors;
      throw error;
    }
    throw new Error(body.error?.message || body.message || 'Application submission failed');
  }

  return {
    success: true,
    reference: body.data?.reference || 'CLC-J-SUBMITTED',
    message: body.message || 'Your application has been received.',
  };
}
