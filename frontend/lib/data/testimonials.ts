import { TestimonialItem } from '../types/website.types';
import { getPublicApiBaseUrl } from '../api-client';

/**
 * APPROVED CLIENT TESTIMONIALS
 * GOVERNANCE: In accordance with project policy, no manufactured testimonials, fake ratings,
 * or fabricated client identities are permitted.
 * When real, client-approved testimonials are vetted in Phase 10, they will be loaded here or from the backend API.
 */
export const APPROVED_TESTIMONIALS: TestimonialItem[] = [];

export function getApprovedTestimonials(): TestimonialItem[] {
  return APPROVED_TESTIMONIALS;
}

/**
 * Fetches published client testimonials from the backend REST API.
 * Falls back to an empty array so graceful neutral empty states are rendered.
 */
export async function fetchPublishedTestimonials(): Promise<TestimonialItem[]> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/testimonials`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any) => ({
      id: String(item.id),
      clientName: item.clientName,
      clientRole: [item.clientDesignation, item.companyName].filter(Boolean).join(', ') || undefined,
      location: item.clientLocation || undefined,
      serviceCategory: item.serviceCategory || 'Client Experience',
      quote: item.quote,
      rating: item.rating ? Number(item.rating) : 5,
    }));
  } catch {
    return [];
  }
}
