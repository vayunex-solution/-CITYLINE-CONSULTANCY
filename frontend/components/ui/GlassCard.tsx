import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  subtleGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function GlassCard({
  children,
  padding = 'md',
  hoverable = true,
  subtleGlow = false,
  className = '',
  style,
  onClick,
}: GlassCardProps) {
  const paddingClass =
    padding === 'sm'
      ? styles.paddingSm
      : padding === 'lg'
      ? styles.paddingLg
      : styles.paddingMd;

  const hoverClass = hoverable ? styles.hoverable : '';
  const glowClass = subtleGlow ? styles.subtleGlow : '';

  return (
    <div
      className={`${styles.card} ${paddingClass} ${hoverClass} ${glowClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
