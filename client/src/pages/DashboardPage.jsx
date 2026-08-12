export default function DashboardPage({ navigate, user }) {
  const options = [
    {
      id: 'incident',
      icon: 'IR',
      title: 'Share a DevOps Incident',
      desc: 'Describe an incident and let our multi-agent system analyse, diagnose, and recommend autonomous remediation steps.',
      accent: '#00d4ff',
      tags: ['Root Cause Analysis', 'Auto-Remediation', 'SLA Impact'],
      action: () => navigate('incident-chat'),
    },
    {
      id: 'repo',
      icon: 'QA',
      title: 'Analyse GitHub Repository',
      desc: 'Provide a GitHub repository URL and get deep analysis of code quality, security vulnerabilities, CI/CD configuration, and DevOps best practices.',
      accent: '#a855f7',
      tags: ['Code Review', 'Security Scan', 'Best Practices'],
      action: () => navigate('repo-analysis'),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 0 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 20,
            padding: '0.4rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--primary)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }} />
            NexAgent · 5 Agents up · All Systems Operational
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            letterSpacing: '-0.03em',
            color: 'var(--foreground)',
            marginBottom: '0.75rem',
          }}>
            Welcome back, <span className="gradient-text">{user?.name || 'Engineer'}</span>
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.6 }}>
            What would you like to do today?
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={opt.action}
              style={{
                background: 'var(--card)',
                border: '1px solid ' + opt.accent + '20',
                borderRadius: 16,
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = opt.accent + '50'
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.3), 0 0 40px ' + opt.accent + '10'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = opt.accent + '20'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Accent corner */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background: 'radial-gradient(circle at top right, ' + opt.accent + '12, transparent 70%)',
                borderRadius: '0 16px 0 0',
              }} />

              {/* Icon */}
              <div style={{
                width: 56,
                height: 56,
                background: opt.accent + '14',
                border: '1px solid ' + opt.accent + '25',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                color: opt.accent,
                marginBottom: '1.25rem',
              }}>
                {opt.icon}
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: 'var(--foreground)',
                marginBottom: '0.75rem',
                letterSpacing: '-0.01em',
              }}>
                {opt.title}
              </h2>

              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
                {opt.desc}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {opt.tags.map(tag => (
                  <span key={tag} style={{
                    background: opt.accent + '10',
                    border: '1px solid ' + opt.accent + '20',
                    borderRadius: 4,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.72rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: opt.accent,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: opt.accent,
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'Syne, sans-serif',
              }}>
                Get Started <span style={{ transition: 'transform 0.2s' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
