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

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
    localStorage.setItem('ma-theme', theme)
  }, [theme])

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
  const onLogout = () => { setUser(null); setPage('home') }

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
      {page === 'incident-chat' && <IncidentChatPage navigate={navigate} />}
      {page === 'repo-analysis' && <RepoAnalysisPage navigate={navigate} />}
    </div>
  )
}
