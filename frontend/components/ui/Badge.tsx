import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'slate' | 'success' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
}: BadgeProps) {
  const getStyle = () => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      borderRadius: 'var(--radius-full)',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      lineHeight: 1,
      padding: size === 'sm' ? '0.25rem 0.55rem' : '0.35rem 0.85rem',
      fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
    };

    switch (variant) {
      case 'gold':
        return {
          ...base,
          background: 'rgba(212, 175, 55, 0.12)',
          color: 'var(--accent-gold-primary)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        };
      case 'success':
        return {
          ...base,
          background: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--status-success)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        };
      case 'outline':
        return {
          ...base,
          background: 'transparent',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-default)',
        };
      case 'slate':
      default:
        return {
          ...base,
          background: 'var(--surface-subtle)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        };
    }
  };

  return <span style={getStyle()} className={className}>{children}</span>;
}
