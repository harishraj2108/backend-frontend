import { useState, useRef, useEffect } from 'react'

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    const codeLine = boldLine.replace(new RegExp('`(.*?)`', 'g'), '<code style="background:rgba(168,85,247,0.12);border-radius:3px;padding:0.1em 0.3em;font-family:JetBrains Mono,monospace;font-size:0.85em;color:#a855f7;">$1</code>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: codeLine }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function RepoAnalysisPage({ navigate, user, initialSessionId, clearInitialSessionId, backTarget }) {
  const [step, setStep] = useState('url') // 'url' | 'chat'
  const [repoUrl, setRepoUrl] = useState('')
  const [repoName, setRepoName] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState('')
  const [sessions, setSessions] = useState([])
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const fetchHistory = () => {
    setLoadingHistory(true)
    fetch('http://localhost:8000/api/chat/history?chat_type=repo', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load history')
        return res.json()
      })
      .then(data => {
        if (data.success && data.sessions) {
          setSessions(data.sessions)
        }
      })
      .catch(err => console.error('Error fetching chat history:', err))
      .finally(() => setLoadingHistory(false))
  }

  useEffect(() => {
    fetchHistory()
    if (initialSessionId) {
      loadSession(initialSessionId)
      clearInitialSessionId()
    }
  }, [initialSessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleAnalyse = () => {
    const trimmed = repoUrl.trim()
    if (!trimmed) { setUrlError('Please enter a GitHub URL.'); return }
    if (!trimmed.includes('github.com')) { setUrlError('Please enter a valid GitHub repository URL.'); return }
    setUrlError('')
    setLoading(true)

    // 1. Create session
    const parsedName = trimmed.split('/').pop().replace('.git', '')
    fetch('http://localhost:8000/api/chat/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_type: 'repo',
        title: 'New Chat',
        repo_name: parsedName
      }),
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create repo session')
        return res.json()
      })
      .then(sessionData => {
        const sid = sessionData.session_id
        setActiveSessionId(sid)
        
        // 2. Call the index API
        return fetch('http://localhost:8000/api/rag/index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ repo_url: trimmed }),
          credentials: 'include'
        }).then(res => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.detail || 'Failed to connect/index the repository')
            })
          }
          return res.json()
        }).then(indexData => {
          setLoading(false)
          setRepoName(indexData.repo_name)
          setStep('chat')
          
          const botText = 'Connected to repository \'' + trimmed + '\'.\n\nIndexing complete! Processed **' + indexData.num_files + '** files and generated **' + indexData.num_chunks + '** vector embeddings. You can now query your repository.'
          
          setMessages([
            {
              role: 'bot',
              text: botText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ])
          fetchHistory()
        })
      })
      .catch(err => {
        setLoading(false)
        setUrlError(err.message || 'Failed to index repository.')
      })
  }

  const handleNewChat = () => {
    setActiveSessionId('')
    setRepoUrl('')
    setRepoName('')
    setMessages([])
    setStep('url')
  }

  const loadSession = (sessionId) => {
    setIsTyping(false)
    setActiveSessionId(sessionId)
    fetch('http://localhost:8000/api/chat/session/' + sessionId, {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch session')
        return res.json()
      })
      .then(data => {
        if (data.success && data.session) {
          setRepoName(data.session.repo_name || '')
          setRepoUrl(data.session.repo_name ? 'https://github.com/' + data.session.repo_name : '')
          setStep('chat')
          if (data.session.messages && data.session.messages.length > 0) {
            setMessages(data.session.messages)
          } else {
            setMessages([
              {
                role: 'bot',
                text: 'Connected to repository. Ask questions about your code!',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            ])
          }
        }
      })
      .catch(err => {
        console.error('Error loading session:', err)
      })
  }

  const handleDeleteSession = (sessionId) => {
    fetch('http://localhost:8000/api/chat/session/' + sessionId, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete chat session')
        return res.json()
      })
      .then(data => {
        if (data.success) {
          if (sessionId === activeSessionId) {
            setActiveSessionId('')
            setRepoUrl('')
            setRepoName('')
            setMessages([])
            setStep('url')
            fetchHistory()
          } else {
            fetchHistory()
          }
        }
      })
      .catch(err => console.error('Error deleting session:', err))
  }

  const sendMessage = () => {
    if (!input.trim() || isTyping) return
    const currentInput = input.trim()
    
    setMessages(m => [...m, { role: 'user', text: currentInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setInput('')
    setIsTyping(true)

    fetch('http://localhost:8000/api/rag/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo_name: repoName,
        question: currentInput,
        session_id: activeSessionId
      }),
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.detail || 'Query failed')
          })
        }
        return res.json()
      })
      .then(data => {
        setIsTyping(false)
        setMessages(m => [...m, {
          role: 'bot',
          text: data.answer || 'I could not retrieve a response.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
        fetchHistory()
      })
      .catch(err => {
        setIsTyping(false)
        setMessages(m => [...m, {
          role: 'bot',
          text: 'Error querying repository: ' + err.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      })
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--background)', overflow: 'hidden' }}>
      
      {/* Left Sidebar */}
      <div style={{
        width: 265,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate(backTarget || 'dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: 0 }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted-foreground)'}
          >
            ← Dashboard
          </button>
          
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(124, 58, 237, 0.15))',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Chat History List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', padding: '0 0.5rem 0.5rem', fontWeight: 600 }}>
            RECENT CONVERSATIONS
          </div>
          
          {loadingHistory && sessions.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Loading history...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
              No chat history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {/* Show first 5 sessions */}
              {sessions.slice(0, 5).map(session => (
                <div
                  key={session.session_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 6,
                    background: activeSessionId === session.session_id ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                    borderLeft: activeSessionId === session.session_id ? '3px solid var(--accent)' : '3px solid transparent',
                    paddingRight: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (activeSessionId !== session.session_id) {
                      e.currentTarget.style.background = 'var(--muted)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeSessionId !== session.session_id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <button
                    onClick={() => loadSession(session.session_id)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      padding: '0.6rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: activeSessionId === session.session_id ? 'var(--foreground)' : 'var(--muted-foreground)',
                      fontSize: '0.82rem',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {session.title || "Untitled Chat"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this chat session?")) {
                        handleDeleteSession(session.session_id);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.4rem',
                      color: 'rgba(239, 68, 68, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      transition: 'all 0.2s',
                    }}
                    title="Delete Chat"
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Toggleable dropdown for full history if length > 5 */}
              {sessions.length > 5 && (
                <div style={{ marginTop: '0.25rem' }}>
                  <button
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {showFullHistory ? '▲ Hide Older' : '▼ View Full History (' + (sessions.length - 5) + ' more)'}
                  </button>

                  {showFullHistory && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.25rem' }}>
                      {sessions.slice(5).map(session => (
                        <div
                          key={session.session_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 6,
                            background: activeSessionId === session.session_id ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                            borderLeft: activeSessionId === session.session_id ? '3px solid var(--accent)' : '3px solid transparent',
                            paddingRight: '0.5rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (activeSessionId !== session.session_id) {
                              e.currentTarget.style.background = 'var(--muted)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (activeSessionId !== session.session_id) {
                              e.currentTarget.style.background = 'transparent'
                            }
                          }}
                        >
                          <button
                            onClick={() => loadSession(session.session_id)}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              padding: '0.6rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: activeSessionId === session.session_id ? 'var(--foreground)' : 'var(--muted-foreground)',
                              fontSize: '0.82rem',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {session.title || "Untitled Chat"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this chat session?")) {
                                handleDeleteSession(session.session_id);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.4rem',
                              color: 'rgba(239, 68, 68, 0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                              transition: 'all 0.2s',
                            }}
                            title="Delete Chat"
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {step === 'url' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflowY: 'auto' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.2, pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
              <div className="glass" style={{ borderRadius: 16, padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: 52, height: 52,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#000',
                    margin: '0 auto 1.25rem',
                    boxShadow: '0 0 30px rgba(168,85,247,0.3)',
                  }}>QA</div>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
                    Analyse GitHub Repo
                  </h1>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    Paste your GitHub repository URL and our agents will perform a comprehensive DevOps analysis.
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={e => { setRepoUrl(e.target.value); setUrlError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
                    disabled={loading}
                    style={{ borderColor: urlError ? '#ef4444' : undefined }}
                  />
                  {urlError && (
                    <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>{urlError}</p>
                  )}
                </div>

                <button
                  className="btn-primary"
                  onClick={handleAnalyse}
                  disabled={loading}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} />
                      <span>Connecting to repository...</span>
                    </>
                  ) : (
                    <span>Start Analysis →</span>
                  )}
                </button>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.25rem' }}>Try an example:</p>
                  {['github.com/kubernetes/kubernetes', 'github.com/docker/compose', 'github.com/prometheus/prometheus'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => setRepoUrl('https://' + ex)}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.2rem 0', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.target.style.opacity = 0.7}
                      onMouseLeave={e => e.target.style.opacity = 1}
                    >
                      → {ex}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Security Scan', 'Code Quality', 'CI/CD Review', 'Dependency Audit', 'Best Practices'].map(tag => (
                    <span key={tag} style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.2rem 0.6rem', borderRadius: 4, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--accent)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 10 }}>
              <button onClick={handleNewChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '1.1rem', padding: '0.25rem' }}>←</button>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#000', flexShrink: 0 }}>QA</div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>Repository Analysis</div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{repoName}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                {['Security', 'Quality', 'CI/CD'].map(a => (
                  <span key={a} style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.2rem 0.6rem', borderRadius: 4, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--accent)' }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
                    {msg.role === 'bot' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600, color: '#000' }}>AI</div>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>RepoAgent · {new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <div
                      className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}
                      style={{ fontSize: '0.875rem', lineHeight: 1.65, fontFamily: 'Inter, sans-serif',
                        ...(msg.role === 'user' ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.15))', border: '1px solid rgba(168,85,247,0.2)' } : {})
                      }}
                    >
                      {formatMessage(msg.text)}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>
                          {(user?.name || 'You') + ' · ' + new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {user?.picture ? (
                          <img src={user.picture} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: '#000', fontSize: '0.55rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
                            {(user?.name || 'Y').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600, color: '#000' }}>AI</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Agents scanning...</span>
                    </div>
                    <div className="chat-bubble-bot" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '1rem' }}>
                      <div className="typing-dot" style={{ background: 'var(--accent)' }} />
                      <div className="typing-dot" style={{ background: 'var(--accent)' }} />
                      <div className="typing-dot" style={{ background: 'var(--accent)' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--card)' }}>
              <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Ask a question about the repository codebase..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  style={{
                    flex: 1,
                    resize: 'none',
                    minHeight: 44,
                    maxHeight: 120,
                    borderRadius: 10,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    padding: '0.65rem 1rem',
                    background: 'var(--muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: input.trim() && !isTyping ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--muted)',
                    border: 'none',
                    cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  ↑
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.6rem', fontFamily: 'Inter, sans-serif' }}>
                Press <kbd style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--muted)', padding: '0 4px', borderRadius: 3, border: '1px solid var(--border)' }}>Enter</kbd> to send · <kbd style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--muted)', padding: '0 4px', borderRadius: 3, border: '1px solid var(--border)' }}>Shift+Enter</kbd> for new line
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
