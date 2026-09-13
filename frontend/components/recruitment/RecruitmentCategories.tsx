import React from 'react';
import Link from 'next/link';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';
import { GlassCard } from '@/components/ui/GlassCard';

export function RecruitmentCategories() {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'hotel': return '🏨';
      case 'sparkles': return '🧹';
      case 'brick': return '🧱';
      case 'hammer': return '🏗️';
      case 'axe': return '🪚';
      case 'bike': return '🛵';
      case 'car': return '🚕';
      case 'truck': return '🚛';
      default: return '💼';
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {MANPOWER_CATEGORIES.map((cat) => (
        <GlassCard key={cat.id} padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.4rem' }} aria-hidden="true">
              {getCategoryIcon(cat.iconName)}
            </span>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {cat.title}
            </h3>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 'var(--space-3)' }}>
            {cat.description}
          </p>
          <Link
            href={`/jobs?category=${encodeURIComponent(cat.title)}`}
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--accent-gold-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>View Vacancies</span>
            <span>→</span>
          </Link>
        </GlassCard>
      ))}
    </div>
  );
}
