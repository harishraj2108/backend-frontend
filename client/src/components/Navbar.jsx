import { useState, useEffect } from 'react'

export default function Navbar({ theme, toggleTheme, currentPage, navigate, isLoggedIn, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', fontWeight: 500 }}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid var(--border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <>
                  <div
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 999,
                      background: 'transparent',
                    }}
                  />
                  <div
                    className="glass"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: 240,
                      zIndex: 1000,
                      borderRadius: 12,
                      padding: '1rem',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(124,58,237,0.05)',
                      border: '1px solid var(--border)',
                      background: theme === 'dark' ? 'rgba(10, 18, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', alignItems: 'center' }}>
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {user?.name || 'NexAgent User'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {user?.email || ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.35rem' }}>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          navigate('dashboard')
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          navigate('incident-chat')
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        Incident Chat
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          navigate('repo-analysis')
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        Repo Analysis
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        onLogout()
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: 6,
                        padding: '0.5rem',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
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
