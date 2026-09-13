/**
 * CITYLINE CONSULTANCY — Administrative Role-Based Access Control (RBAC) Tests
 * Verifies role enforcement, authorization denial audit integration, and IDOR guard logic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { requireRole, assertAdminResourceAccess } from '../src/middleware/auth.middleware';
import { errorHandlerMiddleware } from '../src/middleware/error-handler.middleware';
import { AuthenticatedAdminContext } from '../src/auth/types';

describe('Role-Based Access Control (RBAC) & IDOR Foundations', () => {
  const superAdminContext: AuthenticatedAdminContext = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'super_admin_user',
    email: 'super@citylineconsultancy.ae',
    fullName: 'Super Admin',
    role: 'super_admin',
    roleId: 1,
    tokenJti: 'jti-1',
  };

  const operatorContext: AuthenticatedAdminContext = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'operator_user',
    email: 'op@citylineconsultancy.ae',
    fullName: 'Operator',
    role: 'admin_operator',
    roleId: 2,
    tokenJti: 'jti-2',
  };

  it('permits super_admin on super_admin-only route', async () => {
    const testApp = express();
    testApp.use((req, _res, next) => {
      req.admin = superAdminContext;
      next();
    });
    testApp.get('/test-super-only', requireRole('super_admin'), (_req, res) => {
      res.json({ ok: true });
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-super-only');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('rejects admin_operator on super_admin-only route with 403 FORBIDDEN', async () => {
    const testApp = express();
    testApp.use((req, _res, next) => {
      req.admin = operatorContext;
      next();
    });
    testApp.get('/test-super-only', requireRole('super_admin'), (_req, res) => {
      res.json({ ok: true });
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-super-only');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');
    assert.ok(res.body.error.message.includes('Insufficient administrative privileges'));
  });

  it('permits both roles on multi-role routes', async () => {
    const testApp = express();
    let activeContext = superAdminContext;
    testApp.use((req, _res, next) => {
      req.admin = activeContext;
      next();
    });
    testApp.get('/test-shared', requireRole('super_admin', 'admin_operator'), (_req, res) => {
      res.json({ ok: true });
    });
    testApp.use(errorHandlerMiddleware);

    // Test super admin
    const resSuper = await request(testApp).get('/test-shared');
    assert.equal(resSuper.status, 200);

    // Test operator
    activeContext = operatorContext;
    const resOp = await request(testApp).get('/test-shared');
    assert.equal(resOp.status, 200);
  });

  it('assertAdminResourceAccess enforces IDOR protection policy', () => {
    // 1. Super admin can access ANY resource
    assert.equal(
      assertAdminResourceAccess(superAdminContext, 'someone-else-id'),
      true,
      'Super admin must have global resource access'
    );
    assert.equal(
      assertAdminResourceAccess(superAdminContext, null),
      true,
      'Super admin must have access to unassigned resources'
    );

    // 2. Admin operator can access resources assigned to their own ID
    assert.equal(
      assertAdminResourceAccess(operatorContext, operatorContext.id),
      true,
      'Operator can access own assigned resources'
    );

    // 3. Admin operator can access unassigned resources (for lead triage)
    assert.equal(
      assertAdminResourceAccess(operatorContext, null),
      true,
      'Operator can triage unassigned resources'
    );

    // 4. Admin operator CANNOT access resources assigned to another administrator
    assert.equal(
      assertAdminResourceAccess(operatorContext, 'other-operator-uuid'),
      false,
      'Operator must be denied access to another operator assigned resource'
    );
  });
});
