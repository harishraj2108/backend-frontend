import { useState, useEffect } from 'react'

export default function Navbar({ theme, toggleTheme, currentPage, navigate, isLoggedIn, onLogout }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        background: scrolled
          ? theme === 'dark'
            ? 'rgba(6, 11, 20, 0.92)'
            : 'rgba(240, 244, 255, 0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        padding: '1rem 0',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div
          onClick={() => navigate('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#000',
            fontFamily: 'Syne, sans-serif',
          }}>N</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Nex<span style={{ color: 'var(--primary)' }}>Agent</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            {['Features', 'How It Works', 'Architecture'].map(item => (
              <span key={item} className="nav-link">{item}</span>
            ))}
            {currentPage !== 'home' && (
              <span
                className="nav-link"
                onClick={() => navigate('home')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                ← Home
              </span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--foreground)',
              fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s ease',
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => navigate('dashboard')}
                style={{
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                }}
              >Dashboard</button>
              <button className="btn-outline" onClick={onLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => navigate('login')} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
