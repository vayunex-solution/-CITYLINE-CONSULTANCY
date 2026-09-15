'use client';

/**
 * CITYLINE CONSULTANCY — First-Party Analytics Tracking Component
 * Automatically records genuine SPA page transitions on public website routes.
 * Prevents redundant events from component re-renders.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { recordPageView } from '@/lib/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // 1. Skip if on admin routes (keeps visitor intelligence strictly focused on public traffic)
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    // 2. Prevent duplicate tracking on re-renders for the same route
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    // 3. Dispatch first-party page-view beacon
    void recordPageView(pathname);
  }, [pathname]);

  return null;
}
