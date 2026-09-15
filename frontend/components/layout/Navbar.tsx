'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV_ITEMS } from '@/lib/data/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { MobileMenu } from './MobileMenu';
import styles from './Navbar.module.css';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`.trim()}>
        <div className="container">
          <div className={styles.inner}>
            {/* Brand Logo & Wordmark */}
            <Link href="/" className={styles.brand} aria-label="Cityline Consultancy Home">
              <div className={styles.logoIcon} aria-hidden="true">
                <span>C</span>
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandName}>CITYLINE</span>
                <span className={styles.brandTagline}>CONSULTANCY</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className={styles.desktopNav} aria-label="Primary site navigation">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;

                if (item.children) {
                  return (
                    <div
                      key={item.label}
                      className={styles.dropdownWrapper}
                      onMouseEnter={() => setDropdownOpen(true)}
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${styles.dropdownTrigger} ${
                          pathname.startsWith(item.href) ? styles.navLinkActive : ''
                        }`}
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <span>{item.label}</span>
                        <span aria-hidden="true" style={{ fontSize: '0.65rem' }}>▼</span>
                      </button>

                      {dropdownOpen && (
                        <div className={styles.dropdownMenu}>
                          <Link
                            href={item.href}
                            className={styles.dropdownItem}
                            onClick={() => setDropdownOpen(false)}
                          >
                            <span className={styles.dropdownItemTitle}>All Visa Services</span>
                            <span className={styles.dropdownItemDesc}>Explore residency & entry visas</span>
                          </Link>
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={styles.dropdownItem}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <span className={styles.dropdownItemTitle}>{child.label}</span>
                              {child.description && (
                                <span className={styles.dropdownItemDesc}>{child.description}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className={styles.actions}>
              <ThemeToggle />
              <Button href="/visa-enquiry" size="md" variant="primary">
                Start Your Journey
              </Button>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={PRIMARY_NAV_ITEMS}
        pathname={pathname}
      />
    </>
  );
}
