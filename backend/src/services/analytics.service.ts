/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics Service
 * Business logic for first-party page-view tracking and administrative analytics reporting.
 *
 * GOVERNANCE:
 * - Fail-safe design: tracking errors are gracefully handled without crashing callers.
 * - Privacy-conscious: Raw IP addresses and personal identifiers are never stored.
 * - Real aggregated database counts: No invented metrics or simulated visitors.
 */

import crypto from 'crypto';
import {
  analyticsRepository,
  AnalyticsRepository,
} from '../repositories/analytics.repository';
import {
  TrackPageViewInput,
  AdminAnalyticsQueryParams,
} from '../schemas/analytics.schema';
import {
  parseUserAgent,
  sanitizeReferrer,
  sanitizePathname,
  computeSessionHash,
} from '../utils/user-agent.util';
import { logger } from '../utils/logger';

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository = analyticsRepository) {}

  /**
   * Ingests a public page-view event and handles first-party visitor session lifecycle.
   */
  public async trackPageView(
    input: TrackPageViewInput,
    userAgent?: string | null
  ): Promise<{ success: boolean; recorded: boolean }> {
    try {
      const normalizedPath = sanitizePathname(input.pathname);
      const sessionHash = computeSessionHash(input.sessionId);

      let session = await this.repo.findSessionByHash(sessionHash);

      if (!session) {
        // New anonymous visitor session
        const parsedUa = parseUserAgent(userAgent);
        const cleanReferrer = sanitizeReferrer(input.referrer);
        const newSessionId = crypto.randomUUID();

        session = await this.repo.createSession({
          id: newSessionId,
          session_hash: sessionHash,
          device_category: parsedUa.deviceCategory,
          browser: parsedUa.browser,
          os: parsedUa.os,
          referrer_source: cleanReferrer,
        });
      } else {
        // Returning visitor session: touch last_seen_at
        await this.repo.touchSession(session.id);
      }

      // Record page-view interaction
      await this.repo.recordPageView({
        session_id: session.id,
        page_path: normalizedPath,
        event_name: 'pageview',
      });

      return { success: true, recorded: true };
    } catch (err: any) {
      logger.error('Failed to ingest analytics page-view event:', err);
      // Fail-safe: tracking failure must never break caller
      return { success: false, recorded: false };
    }
  }

  /**
   * Retrieves aggregated analytics intelligence for administrative dashboard reporting.
   */
  public async getAnalyticsOverview(query: AdminAnalyticsQueryParams) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (query.startDate && query.endDate) {
      startDate = new Date(`${query.startDate}T00:00:00.000Z`);
      endDate = new Date(`${query.endDate}T23:59:59.999Z`);
    } else {
      switch (query.period) {
        case 'today': {
          const todayStart = new Date(now);
          todayStart.setUTCHours(0, 0, 0, 0);
          startDate = todayStart;
          break;
        }
        case '7d': {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case '30d': {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        }
        case 'all':
        default: {
          startDate = new Date('2020-01-01T00:00:00.000Z');
          break;
        }
      }
    }

    const data = await this.repo.getAggregatedOverview({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return {
      period: query.period,
      timeframe: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      ...data,
    };
  }
}

export const analyticsService = new AnalyticsService();
