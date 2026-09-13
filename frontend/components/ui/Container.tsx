import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
  style?: React.CSSProperties;
}

export function Container({
  children,
  className = '',
  size = 'default',
  style,
}: ContainerProps) {
  const maxWidth =
    size === 'narrow' ? '960px' : size === 'wide' ? '1440px' : '1280px';

  return (
    <div
      className={`container ${className}`.trim()}
      style={{
        maxWidth,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
