'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { NavItem } from '@/lib/types/website.types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  pathname: string;
}

export function MobileMenu({ isOpen, onClose, items, pathname }: MobileMenuProps) {
  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        backgroundColor: 'var(--surface-overlay)',
        backdropFilter: 'var(--backdrop-blur-md)',
        WebkitBackdropFilter: 'var(--backdrop-blur-md)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: 'var(--surface-elevated)',
          borderBottom: '1px solid var(--border-default)',
          padding: 'var(--space-6)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
            }}
          >
            CITYLINE CONSULTANCY
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mobile menu"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
            }}
          >
            ✕
          </button>
        </div>

        <nav aria-label="Mobile site links" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'block',
                    padding: 'var(--space-3) var(--space-2)',
                    fontSize: 'var(--text-base)',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent-gold-primary)' : 'var(--text-primary)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div style={{ paddingLeft: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={onClose}
                        style={{
                          display: 'block',
                          padding: 'var(--space-2) 0',
                          fontSize: 'var(--text-sm)',
                          color: pathname === child.href ? 'var(--accent-gold-primary)' : 'var(--text-secondary)',
                          textDecoration: 'none',
                        }}
                      >
                        → {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Theme Appearance</span>
            <ThemeToggle />
          </div>
          <Button href="/visa-enquiry" onClick={onClose} size="lg" style={{ width: '100%' }}>
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
