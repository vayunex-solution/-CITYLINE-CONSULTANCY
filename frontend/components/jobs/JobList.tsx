'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { JobFilters } from './JobFilters';
import { JobCard } from './JobCard';
import { Button } from '@/components/ui/Button';
import { fetchPublishedJobs } from '@/lib/jobs-api';
import { JobOpportunity } from '@/lib/types/website.types';

interface JobListProps {
  initialCategory?: string;
  limit?: number;
  showFilters?: boolean;
}

export function JobList({
  initialCategory = '',
  limit = 12,
  showFilters = true,
}: JobListProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams ? searchParams.get('category') || '' : '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || categoryFromUrl);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetchPublishedJobs({
        search: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        page: currentPage,
        limit,
      });

      setJobs(res.jobs);
      setTotalJobs(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, currentPage, limit]);

  useEffect(() => {
    // Debounce search/filter changes
    const timer = setTimeout(() => {
      void loadJobs();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadJobs]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    setCurrentPage(1);
  };

  return (
    <div>
      {showFilters && (
        <JobFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          onReset={handleReset}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="glass-panel"
              style={{
                height: '280px',
                borderRadius: 'var(--radius-lg)',
                opacity: 0.5,
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ) : hasError ? (
        /* Error State */
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Unable to Load Opportunities</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: '460px' }}>
            We encountered a temporary connection issue while retrieving vacancies. Please try again.
          </p>
          <Button onClick={() => void loadJobs()} variant="primary" size="md">
            Retry
          </Button>
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                marginTop: 'var(--space-10)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <Button
                variant="glass"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages} ({totalJobs} total)
              </span>
              <Button
                variant="glass"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
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
