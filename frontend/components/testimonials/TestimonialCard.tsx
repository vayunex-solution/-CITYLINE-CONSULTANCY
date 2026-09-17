import React from 'react';
import { TestimonialItem } from '@/lib/types/website.types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

interface TestimonialCardProps {
  testimonial: TestimonialItem;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <GlassCard padding="lg" subtleGlow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {testimonial.serviceCategory ? (
            <Badge variant="gold">{testimonial.serviceCategory}</Badge>
          ) : <span />}
          {testimonial.rating ? (
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }} aria-label={`${testimonial.rating} out of 5 stars`}>
              {Array.from({ length: Math.min(5, Math.max(1, testimonial.rating)) }).map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="var(--accent-gold-primary)" stroke="none" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          ) : null}
        </div>

        <blockquote
          style={{
            fontSize: 'var(--text-sm)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            flex: 1,
          }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--accent-gold-primary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {testimonial.clientName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {testimonial.clientName}
            </div>
            {(testimonial.clientRole || testimonial.location) && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {[testimonial.clientRole, testimonial.location].filter(Boolean).join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
