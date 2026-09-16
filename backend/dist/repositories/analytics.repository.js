"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics Repository
 * High-performance database operations for first-party visitor sessions and page-view metrics.
 *
 * GOVERNANCE:
 * - Direct database access restricted to this repository layer.
 * - Server-side aggregation prevents streaming massive raw datasets to client.
 * - Privacy-conscious: Raw IP addresses and personal information are never stored or queried here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRepository = exports.AnalyticsRepository = void 0;
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class AnalyticsRepository {
    customDb;
    constructor(customDb) {
        this.customDb = customDb;
    }
    get db() {
        return this.customDb || (0, connection_1.getDbClient)();
    }
    /**
     * Finds an existing visitor session by its deterministic cryptographic hash.
     */
    async findSessionByHash(sessionHash) {
        try {
            const row = await this.db('visitor_sessions')
                .where({ session_hash: sessionHash })
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AnalyticsRepository.findSessionByHash');
        }
    }
    /**
     * Inserts a new visitor session.
     */
    async createSession(data) {
        try {
            await this.db('visitor_sessions').insert({
                id: data.id,
                session_hash: data.session_hash,
                device_category: data.device_category,
                browser: data.browser,
                os: data.os,
                referrer_source: data.referrer_source,
                first_seen_at: this.db.fn.now(),
                last_seen_at: this.db.fn.now(),
                created_at: this.db.fn.now(),
            });
            const inserted = await this.db('visitor_sessions').where({ id: data.id }).first();
            return inserted;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AnalyticsRepository.createSession');
        }
    }
    /**
     * Updates last_seen_at for an active session.
     */
    async touchSession(sessionId) {
        try {
            await this.db('visitor_sessions')
                .where({ id: sessionId })
                .update({
                last_seen_at: this.db.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AnalyticsRepository.touchSession');
        }
    }
    /**
     * Records a single page-view interaction event.
     */
    async recordPageView(data) {
        try {
            await this.db('page_views').insert({
                session_id: data.session_id,
                page_path: data.page_path,
                event_name: data.event_name || 'pageview',
                duration_seconds: 0,
                created_at: this.db.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AnalyticsRepository.recordPageView');
        }
    }
    /**
     * Aggregates server-side analytics metrics for a bounded date range.
     */
    async getAggregatedOverview(filter) {
        try {
            const db = this.db;
            const toSqlDate = (d) => {
                const date = typeof d === 'string' ? new Date(d) : d;
                return isNaN(date.getTime())
                    ? String(d)
                    : date.toISOString().replace('T', ' ').slice(0, 19);
            };
            const start = toSqlDate(filter.startDate);
            const end = toSqlDate(filter.endDate);
            // 1. Total Visitors (first seen in range)
            const visitorsRow = await db('visitor_sessions')
                .where('first_seen_at', '>=', start)
                .where('first_seen_at', '<=', end)
                .count('id as count')
                .first();
            const totalVisitors = Number(visitorsRow?.count || 0);
            // 2. Total Page Views in range
            const pageViewsRow = await db('page_views')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .count('id as count')
                .first();
            const totalPageViews = Number(pageViewsRow?.count || 0);
            // 3. Unique Visitors who viewed pages in range
            const uniqueVisitorsRow = await db('page_views')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .countDistinct('session_id as count')
                .first();
            const uniqueVisitors = Number(uniqueVisitorsRow?.count || 0);
            // 4. Top Pages
            const topPagesRows = await db('page_views')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .select('page_path as path')
                .count('id as views')
                .groupBy('page_path')
                .orderBy('views', 'desc')
                .limit(10);
            const topPages = topPagesRows.map((r) => ({
                path: String(r.path),
                views: Number(r.views || 0),
            }));
            // 5. Traffic / Referrer Sources
            const trafficRows = await db('visitor_sessions')
                .where('first_seen_at', '>=', start)
                .where('first_seen_at', '<=', end)
                .select('referrer_source as source')
                .count('id as count')
                .groupBy('referrer_source')
                .orderBy('count', 'desc')
                .limit(10);
            const trafficSources = trafficRows.map((r) => ({
                source: String(r.source || 'Direct'),
                count: Number(r.count || 0),
            }));
            // 6. Device Categories Breakdown
            const deviceRows = await db('visitor_sessions')
                .where('first_seen_at', '>=', start)
                .where('first_seen_at', '<=', end)
                .select('device_category as device')
                .count('id as count')
                .groupBy('device_category')
                .orderBy('count', 'desc');
            const deviceBreakdown = deviceRows.map((r) => ({
                device: String(r.device || 'desktop'),
                count: Number(r.count || 0),
            }));
            // 7. Conversions (Persisted Enquiries and Job Applications created in range)
            const visaEnquiriesRow = await db('enquiries')
                .where('enquiry_type', 'visa_enquiry')
                .whereNull('deleted_at')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .count('id as count')
                .first();
            const visaEnquiries = Number(visaEnquiriesRow?.count || 0);
            const manpowerEnquiriesRow = await db('manpower_enquiries')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .count('id as count')
                .first();
            const manpowerEnquiries = Number(manpowerEnquiriesRow?.count || 0);
            const jobApplicationsRow = await db('job_applications')
                .whereNull('deleted_at')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .count('id as count')
                .first();
            const jobApplications = Number(jobApplicationsRow?.count || 0);
            const totalConversions = visaEnquiries + manpowerEnquiries + jobApplications;
            const conversionDenominator = totalVisitors > 0 ? totalVisitors : uniqueVisitors;
            const conversionRate = conversionDenominator > 0
                ? Number(((totalConversions / conversionDenominator) * 100).toFixed(2))
                : 0;
            // 8. Daily Trend (Dialect-agnostic grouping)
            const isSqlite = (db.client?.config?.client === 'sqlite3') ||
                (db.client?.dialect === 'sqlite3');
            const dateExpr = isSqlite
                ? db.raw("strftime('%Y-%m-%d', created_at) as day")
                : db.raw("DATE_FORMAT(created_at, '%Y-%m-%d') as day");
            const dailyRows = await db('page_views')
                .where('created_at', '>=', start)
                .where('created_at', '<=', end)
                .select(dateExpr)
                .count('id as views')
                .countDistinct('session_id as visitors')
                .groupBy('day')
                .orderBy('day', 'asc');
            const recentTrend = dailyRows.map((r) => ({
                date: String(r.day),
                views: Number(r.views || 0),
                visitors: Number(r.visitors || 0),
            }));
            return {
                metrics: {
                    totalVisitors,
                    totalPageViews,
                    uniqueVisitors,
                    conversionRate,
                    totalConversions,
                },
                conversions: {
                    visaEnquiries,
                    manpowerEnquiries,
                    jobApplications,
                    total: totalConversions,
                },
                topPages,
                trafficSources,
                deviceBreakdown,
                recentTrend,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AnalyticsRepository.getAggregatedOverview');
        }
    }
}
exports.AnalyticsRepository = AnalyticsRepository;
exports.analyticsRepository = new AnalyticsRepository();
