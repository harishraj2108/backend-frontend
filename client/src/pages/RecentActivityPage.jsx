import { useState, useEffect } from 'react'

export default function RecentActivityPage({ navigate, navigateToSession }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchActivities = () => {
    setLoading(true)
    fetch('http://localhost:8000/api/chat/history', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch activity history')
        return res.json()
      })
      .then((data) => {
        if (data.success && data.sessions) {
          setActivities(data.sessions)
        }
      })
      .catch((err) => {
        console.error('Error fetching activities:', err)
        setError(err.message || 'Could not load recent activities.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleDelete = (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this activity?')) return

    fetch('http://localhost:8000/api/chat/session/' + sessionId, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete activity')
        return res.json()
      })
      .then((data) => {
        if (data.success) {
          setActivities((prev) => prev.filter((act) => act.session_id !== sessionId))
        }
      })
      .catch((err) => {
        console.error('Error deleting activity:', err)
        alert('Could not delete session: ' + err.message)
      })
  }

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 0 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* BG Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>
        {/* Back Button */}
        <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted-foreground)'}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 20,
            padding: '0.4rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--accent)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            NexAgent Activity Logger
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            letterSpacing: '-0.03em',
            color: 'var(--foreground)',
            marginBottom: '0.75rem',
          }}>
            Recent <span className="gradient-text">Activity</span>
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            A unified history of all your DevOps incident diagnostics and GitHub repository analyses.
          </p>
        </div>

        {/* Content Area */}
        <div style={{ padding: '0 1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', padding: '5rem 0', gap: '1rem' }}>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin-slow 0.8s linear infinite',
              }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>Loading activity logs...</div>
            </div>
          ) : error ? (
            <div className="glass" style={{ borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ color: '#ef4444', fontFamily: 'Syne, sans-serif', marginBottom: '0.5rem' }}>Error Loading History</h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
              <button className="btn-outline" onClick={fetchActivities}>Try Again</button>
            </div>
          ) : activities.length === 0 ? (
            <div className="glass" style={{ borderRadius: 16, padding: '5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📋</div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>No Activity Found</h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: 450, margin: '0 auto 2rem' }}>
                You haven't run any analyses or chats yet. Get started by describing an incident or analysing a repository.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('incident-chat')}>
                  <span>Triage Incident</span>
                </button>
                <button className="btn-outline" onClick={() => navigate('repo-analysis')}>
                  Analyse Repo
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.map((act) => {
                const isIncident = act.chat_type === 'incident'
                const accentColor = isIncident ? 'var(--primary)' : 'var(--accent)'
                const labelText = isIncident ? 'Incident Chat' : 'Repo Analysis'
                const iconSymbol = isIncident ? '🤖' : '🔍'

                return (
                  <div
                    key={act.session_id}
                    onClick={() => navigateToSession(act.session_id, act.chat_type)}
                    className="glass"
                    style={{
                      borderRadius: 12,
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accentColor + '40'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden', flex: 1 }}>
                      {/* Icon container */}
                      <div style={{
                        width: 44, height: 44,
                        background: accentColor + '10',
                        border: '1px solid ' + accentColor + '20',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0,
                      }}>
                        {iconSymbol}
                      </div>

                      {/* Main Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{
                            background: accentColor + '08',
                            border: '1px solid ' + accentColor + '15',
                            borderRadius: 4,
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.7rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: accentColor,
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                          }}>
                            {labelText}
                          </span>
                          {act.repo_name && (
                            <span style={{
                              fontSize: '0.75rem',
                              fontFamily: 'JetBrains Mono, monospace',
                              color: 'var(--muted-foreground)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              /{act.repo_name}
                            </span>
                          )}
                        </div>
                        <h3 style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: 'var(--foreground)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {act.title || 'Untitled Session'}
                        </h3>
                      </div>
                    </div>

                    {/* Meta info & Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>LAST ACTIVE</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}>
                          {new Date(act.updated_at).toLocaleDateString()} at{' '}
                          {new Date(act.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Delete icon */}
                      <button
                        onClick={(e) => handleDelete(e, act.session_id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderRadius: 6,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#ef4444',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
                        }}
                        title="Delete Session"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
