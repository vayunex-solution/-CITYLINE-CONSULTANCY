import { TestimonialItem } from '../types/website.types';

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
