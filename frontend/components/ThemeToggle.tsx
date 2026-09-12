'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentTheme =
      (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('clc_theme', nextTheme);
    } catch {
      // Storage unavailable
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle visual theme"
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
        }}
      >
        Theme
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: 'var(--surface-elevated)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all var(--transition-fast)',
      }}
    >
      <span>{theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
    </button>
  );
}
