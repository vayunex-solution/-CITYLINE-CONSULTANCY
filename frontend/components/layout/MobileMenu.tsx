'use client';

import React, { useEffect, useState } from 'react';
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
  // Track open state for submenus (Services, etc.) — collapsed by default
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpandedItems({});
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
            const isActive = pathname === item.href || (item.children && item.children.some((c) => pathname === c.href));
            const isExpanded = !!expandedItems[item.label];

            if (item.children) {
              return (
                <div key={item.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) 0',
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--accent-gold-primary)' : 'var(--text-primary)',
                        textDecoration: 'none',
                        flex: 1,
                        padding: 'var(--space-2) var(--space-2)',
                      }}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpanded(item.label);
                      }}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle ${item.label} submenu`}
                      style={{
                        background: isExpanded ? 'rgba(179, 135, 27, 0.12)' : 'var(--surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isExpanded ? 'var(--accent-gold-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        aria-hidden="true"
                      >
                        <polyline points="2,4 6,8 10,4" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        paddingLeft: 'var(--space-3)',
                        paddingRight: 'var(--space-3)',
                        paddingBottom: 'var(--space-2)',
                        paddingTop: 'var(--space-1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1)',
                        background: 'var(--surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-2)',
                        borderLeft: '2px solid var(--accent-gold-primary)',
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        style={{
                          display: 'block',
                          padding: 'var(--space-2) var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          color: pathname === item.href ? 'var(--accent-gold-primary)' : 'var(--text-primary)',
                          textDecoration: 'none',
                        }}
                      >
                        All {item.label}
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={onClose}
                          style={{
                            display: 'block',
                            padding: 'var(--space-2) var(--space-2)',
                            fontSize: 'var(--text-sm)',
                            color: pathname === child.href ? 'var(--accent-gold-primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          → {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

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
