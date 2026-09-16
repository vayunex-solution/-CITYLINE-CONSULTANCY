import React from 'react';
import Link from 'next/link';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';
import { GlassCard } from '@/components/ui/GlassCard';

export function RecruitmentCategories() {
  const renderCategoryIcon = (iconName: string) => {
    const props = {
      width: 20,
      height: 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'var(--accent-gold-primary)',
      strokeWidth: 1.75,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (iconName) {
      case 'hotel':
        return (
          <svg {...props}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" /></svg>
        );
      case 'sparkles':
        return (
          <svg {...props}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
        );
      case 'brick':
        return (
          <svg {...props}><rect x="3" y="4" width="18" height="16" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="14" x2="21" y2="14" /><line x1="9" y1="4" x2="9" y2="9" /><line x1="15" y1="4" x2="15" y2="9" /><line x1="6" y1="9" x2="6" y2="14" /><line x1="12" y1="9" x2="12" y2="14" /><line x1="18" y1="9" x2="18" y2="14" /></svg>
        );
      case 'hammer':
        return (
          <svg {...props}><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" /><path d="M17.64 4.36a3 3 0 0 0-4.24 0L12 5.76l6.24 6.24 1.4-1.4a3 3 0 0 0 0-4.24z" /></svg>
        );
      case 'axe':
        return (
          <svg {...props}><path d="M14 2l6 6-4 4-6-6 4-4z" /><path d="M10 8L3 15l6 6 7-7" /></svg>
        );
      case 'bike':
        return (
          <svg {...props}><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M9 17h6M12 17V9l3 3h4M12 9L9 5H6" /></svg>
        );
      case 'car':
        return (
          <svg {...props}><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M5 11l2-5h10l2 5M7 18v2M17 18v2" /></svg>
        );
      case 'truck':
        return (
          <svg {...props}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
        );
      default:
        return (
          <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
        );
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
              {renderCategoryIcon(cat.iconName)}
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
