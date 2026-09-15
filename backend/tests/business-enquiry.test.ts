/**
 * CITYLINE CONSULTANCY — Phase 13 Business & Visa Integration Tests
 * Validates public business enquiry validation, error envelopes, and visa services listing.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app';
import { businessEnquirySchema } from '../src/schemas/business-enquiry.schema';

describe('Phase 13 Integration Endpoints', () => {
  describe('GET /api/v1/visa-enquiries/services', () => {
    it('should route to services listing without error', async () => {
      const res = await request(app).get('/api/v1/visa-enquiries/services');
      // Depending on DB availability in test runner, either 200 with array or 503 if remote DB is unreachable
      assert.ok([200, 503].includes(res.status));
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
      }
    });
  });

  describe('Business Enquiry Schema Validation', () => {
    it('should validate valid business enquiry data', () => {
      const validData = {
        fullName: 'Ahmed Al Mansoori',
        email: 'ahmed@example.com',
        phone: '+971501234567',
        service: 'UAE Company Formation',
        preferredJurisdiction: 'Mainland',
        activityType: 'Commercial Trading',
        shareholdersCount: 2,
        visaQuotaNeeded: 5,
        message: 'Interested in LLC registration in Dubai.',
        consent: true,
      };

      const result = businessEnquirySchema.safeParse(validData);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.fullName, 'Ahmed Al Mansoori');
        assert.strictEqual(result.data.email, 'ahmed@example.com');
        assert.strictEqual(result.data.consent, true);
      }
    });

    it('should reject invalid email and missing phone', () => {
      const invalidData = {
        fullName: 'A',
        email: 'not-an-email',
        service: '',
        message: 'Hi',
        consent: false,
      };

      const result = businessEnquirySchema.safeParse(invalidData);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path.join('.'));
        assert.ok(issues.includes('fullName'));
        assert.ok(issues.includes('email'));
        assert.ok(issues.includes('phone'));
        assert.ok(issues.includes('consent'));
      }
    });
  });

  describe('POST /api/v1/business-enquiries', () => {
    it('should return 400 VALIDATION_ERROR when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/business-enquiries')
        .send({
          fullName: '',
          email: 'bad-email',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
      assert.ok(res.body.error.details?.fieldErrors);
      assert.ok(res.body.error.details.fieldErrors.fullName);
      assert.ok(res.body.error.details.fieldErrors.email);
    });
  });
});
