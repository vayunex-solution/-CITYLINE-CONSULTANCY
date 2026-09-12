import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-8)',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(197, 155, 39, 0.08) 0%, transparent 70%)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '800px',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              CITYLINE CONSULTANCY
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              Phase 1 — Development Environment & Architecture Shell
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
            <h2
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Workspace Monorepo
            </h2>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--status-success)' }}>
              ✓ Workspaces Active
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Root npm workspaces managing @cityline/shared, backend, and frontend.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
            <h2
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Design Tokens
            </h2>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--status-success)' }}>
              ✓ Tokens & Theme Ready
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              CSS Custom Properties supporting Light & Dark themes with glassmorphism.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
            <h2
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Backend API Engine
            </h2>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--status-success)' }}>
              ✓ REST & Health Ready
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Layered Express engine with error handling, logging, and GET /health.
            </p>
          </div>
        </section>

        <footer
          style={{
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span>Production DB Engine: UNVERIFIED (Pending Host Inspection)</span>
          <span>Next: Phase 2 Database Architecture</span>
        </footer>
      </div>
    </main>
  );
}
