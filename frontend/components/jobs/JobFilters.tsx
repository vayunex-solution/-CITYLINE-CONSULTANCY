'use client';

import React from 'react';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';

interface JobFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  onReset: () => void;
}

export function JobFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  onReset,
}: JobFiltersProps) {
  const locations = ['All Locations', 'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE'];

  return (
    <div
      className="glass-panel"
      style={{
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'center',
        }}
      >
        {/* Search Input */}
        <div>
          <label
            htmlFor="job-search"
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Search Vacancies
          </label>
          <input
            id="job-search"
            type="text"
            placeholder="e.g. Mason, Hotel, Driver..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label
            htmlFor="job-category"
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Category
          </label>
          <select
            id="job-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            {MANPOWER_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.title}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* Location Dropdown */}
        <div>
          <label
            htmlFor="job-location"
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Location
          </label>
          <select
            id="job-location"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc === 'All Locations' ? '' : loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Action */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '0.65rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
