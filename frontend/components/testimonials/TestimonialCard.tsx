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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {testimonial.serviceCategory ? (
            <Badge variant="gold">{testimonial.serviceCategory}</Badge>
          ) : <span />}
          {testimonial.rating ? (
            <span style={{ color: 'var(--accent-gold-primary)', fontSize: '1.2rem', letterSpacing: '2px' }} aria-label={`${testimonial.rating} out of 5 stars`}>
              {'★'.repeat(Math.min(5, Math.max(1, testimonial.rating)))}
            </span>
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
