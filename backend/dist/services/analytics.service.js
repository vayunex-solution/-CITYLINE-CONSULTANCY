"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics Service
 * Business logic for first-party page-view tracking and administrative analytics reporting.
 *
 * GOVERNANCE:
 * - Fail-safe design: tracking errors are gracefully handled without crashing callers.
 * - Privacy-conscious: Raw IP addresses and personal identifiers are never stored.
 * - Real aggregated database counts: No invented metrics or simulated visitors.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const analytics_repository_1 = require("../repositories/analytics.repository");
const user_agent_util_1 = require("../utils/user-agent.util");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    repo;
    constructor(repo = analytics_repository_1.analyticsRepository) {
        this.repo = repo;
    }
    /**
     * Ingests a public page-view event and handles first-party visitor session lifecycle.
     */
    async trackPageView(input, userAgent) {
        try {
            const normalizedPath = (0, user_agent_util_1.sanitizePathname)(input.pathname);
            const sessionHash = (0, user_agent_util_1.computeSessionHash)(input.sessionId);
            let session = await this.repo.findSessionByHash(sessionHash);
            if (!session) {
                // New anonymous visitor session
                const parsedUa = (0, user_agent_util_1.parseUserAgent)(userAgent);
                const cleanReferrer = (0, user_agent_util_1.sanitizeReferrer)(input.referrer);
                const newSessionId = crypto_1.default.randomUUID();
                session = await this.repo.createSession({
                    id: newSessionId,
                    session_hash: sessionHash,
                    device_category: parsedUa.deviceCategory,
                    browser: parsedUa.browser,
                    os: parsedUa.os,
                    referrer_source: cleanReferrer,
                });
            }
            else {
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
        }
        catch (err) {
            logger_1.logger.error('Failed to ingest analytics page-view event:', err);
            // Fail-safe: tracking failure must never break caller
            return { success: false, recorded: false };
        }
    }
    /**
     * Retrieves aggregated analytics intelligence for administrative dashboard reporting.
     */
    async getAnalyticsOverview(query) {
        const now = new Date();
        let startDate;
        let endDate = now;
        if (query.startDate && query.endDate) {
            startDate = new Date(`${query.startDate}T00:00:00.000Z`);
            endDate = new Date(`${query.endDate}T23:59:59.999Z`);
        }
        else {
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
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
