'use client';

import React, { useState, useMemo } from 'react';
import { SEED_JOBS } from '@/lib/data/jobs';
import { JobFilters } from './JobFilters';
import { JobCard } from './JobCard';
import { Button } from '@/components/ui/Button';

interface JobListProps {
  initialCategory?: string;
  limit?: number;
  showFilters?: boolean;
}

export function JobList({
  initialCategory = '',
  limit,
  showFilters = true,
}: JobListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState('');

  const filteredJobs = useMemo(() => {
    return SEED_JOBS.filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || job.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesLocation =
        !selectedLocation || job.location.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [searchQuery, selectedCategory, selectedLocation]);

  const displayedJobs = limit ? filteredJobs.slice(0, limit) : filteredJobs;

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  return (
    <div>
      {showFilters && (
        <JobFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          onReset={handleReset}
        />
      )}

      {displayedJobs.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {displayedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="glass-panel"
          style={{
            padding: 'var(--space-12)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🔍</span>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>No Opportunities Found</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: '460px' }}>
            No active vacancies currently match your search criteria. Try modifying your search keywords or resetting filters.
          </p>
          <Button onClick={handleReset} variant="glass" size="md">
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
