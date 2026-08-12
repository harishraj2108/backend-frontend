import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import IncidentChatPage from './pages/IncidentChatPage'
import RepoAnalysisPage from './pages/RepoAnalysisPage'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ma-theme') || 'dark')
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
    localStorage.setItem('ma-theme', theme)
  }, [theme])

  useEffect(() => {
    // Check if user has an active session
    fetch('http://localhost:8000/auth/me', {
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('Not authenticated')
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user)
          // Automatically redirect authenticated user to dashboard if on landing pages
          setPage((prev) => (prev === 'home' || prev === 'login') ? 'dashboard' : prev)
        }
      })
      .catch((err) => {
        console.log('Session restoration skipped:', err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const navigate = (target) => {
    if ((target === 'dashboard' || target === 'incident-chat' || target === 'repo-analysis') && !user) {
      setPage('login')
      return
    }
    setPage(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onLogin = (userData) => setUser(userData)

  const onLogout = () => {
    fetch('http://localhost:8000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
      .catch((err) => console.error('Logout request failed:', err))
      .finally(() => {
        setUser(null)
        setPage('home')
      })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div 
          className="animate-pulse-glow"
          style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 0 40px rgba(0,212,255,0.3)',
            marginBottom: '1.5rem',
          }}
        >
          🤖
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--muted-foreground)',
          letterSpacing: '0.15em',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
        }}>
          Initialising NexAgent...
        </div>
      </div>
    )
  }

  const showNavbar = page !== 'incident-chat' && page !== 'repo-analysis'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)', transition: 'background 0.3s, color 0.3s' }}>
      {showNavbar && (
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          currentPage={page}
          navigate={navigate}
          isLoggedIn={!!user}
          user={user}
          onLogout={onLogout}
        />
      )}

      {/* Theme toggle accessible from chat pages too */}
      {!showNavbar && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1100 }}>
          <button
            onClick={toggleTheme}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '0.4rem 0.9rem', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      )}

      {page === 'home' && <HomePage navigate={navigate} />}
      {page === 'login' && <LoginPage navigate={navigate} onLogin={onLogin} />}
      {page === 'dashboard' && <DashboardPage navigate={navigate} user={user} />}
      {page === 'incident-chat' && <IncidentChatPage navigate={navigate} user={user} />}
      {page === 'repo-analysis' && <RepoAnalysisPage navigate={navigate} user={user} />}
    </div>
  )
}
