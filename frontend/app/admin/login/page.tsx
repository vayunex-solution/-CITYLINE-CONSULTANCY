'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/lib/admin/admin-auth';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identity.trim() || !password.trim()) {
      setError('Please provide both administrative username/email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(identity.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Verify credentials and account status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface-base)',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <img
            src="/logo-light.png"
            alt="Cityline Consultancy"
            style={{
              width: '180px',
              maxWidth: '100%',
              height: 'auto',
              margin: '0 auto var(--space-3)',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
            }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: 'var(--space-2)',
            }}
          >
            Cityline Admin
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Restricted Administrative Access Console
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--status-error)',
              color: 'var(--status-error)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Username or Email
            </label>
            <input
              type="text"
              required
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-base)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. admin or admin@cityline.ae"
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-base)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent-gold-primary)',
              color: '#ffffff',
              border: 'none',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
