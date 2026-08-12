import { useState, useRef, useEffect } from 'react'

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    const codeLine = boldLine.replace(new RegExp('`(.*?)`', 'g'), '<code style="background:rgba(0,212,255,0.1);border-radius:3px;padding:0.1em 0.3em;font-family:JetBrains Mono,monospace;font-size:0.85em;color:#00d4ff;">$1</code>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: codeLine }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function IncidentChatPage({ navigate, user, initialSessionId, clearInitialSessionId, backTarget }) {
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
    fetch('http://localhost:8000/api/chat/history?chat_type=incident', {
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
    } else {
      showWelcomeMessage()
    }
  }, [initialSessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const showWelcomeMessage = () => {
    setMessages([
      {
        role: 'bot',
        text: 'Hello! I\'m your DevOps Incident Response Assistant, powered by a network of specialized agents.\n\nDescribe your incident, ask about infrastructure issues, deployment failures, monitoring alerts, or any DevOps challenge — I\'m here to help diagnose and resolve it.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ])
  }

  const handleNewChat = () => {
    setActiveSessionId('')
    showWelcomeMessage()
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
          if (data.session.messages && data.session.messages.length > 0) {
            setMessages(data.session.messages)
          } else {
            showWelcomeMessage()
          }
        }
      })
      .catch(err => {
        console.error('Error loading session:', err)
        showWelcomeMessage()
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
            setMessages([])
            handleNewChat()
          }
          fetchHistory()
        }
      })
      .catch(err => console.error('Error deleting session:', err))
  }

  const sendMessage = () => {
    if (!input.trim() || isTyping) return
    const currentInput = input.trim()
    const userMsg = { role: 'user', text: currentInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(m => [...m, userMsg])
    setInput('')
    setIsTyping(true)

    const postMessage = (sid) => {
      fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: sid
        }),
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.detail || 'Failed to send message')
            })
          }
          return res.json()
        })
        .then(data => {
          setIsTyping(false)
          if (data.response) {
            setMessages(m => [...m, {
              role: 'bot',
              text: data.response,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
            fetchHistory()
          }
        })
        .catch(err => {
          console.error('Error sending message:', err)
          setIsTyping(false)
          setMessages(m => [...m, {
            role: 'bot',
            text: 'Connection Error: Could not retrieve response from the Incident Response Agent network. Detail: ' + err.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        })
    }

    if (!activeSessionId) {
      fetch('http://localhost:8000/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_type: 'incident',
          title: 'New Chat'
        }),
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to create session')
          return res.json()
        })
        .then(data => {
          if (data.success && data.session_id) {
            setActiveSessionId(data.session_id)
            postMessage(data.session_id)
          } else {
            throw new Error('Invalid session response')
          }
        })
        .catch(err => {
          console.error('Error auto-creating session:', err)
          setIsTyping(false)
          setMessages(m => [...m, {
            role: 'bot',
            text: 'Session Error: Could not initialize chat session. Detail: ' + err.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        })
    } else {
      postMessage(activeSessionId)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'Database latency spike in production',
    'Kubernetes pod keeps crashing (OOMKilled)',
    'CI/CD pipeline stuck on staging deploy',
    'API gateway returning 503 errors',
  ]

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
            onMouseEnter={e => e.target.style.color = 'var(--primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted-foreground)'}
          >
            ← Dashboard
          </button>
          
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 58, 237, 0.15))',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: 'var(--primary)',
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
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.15)'
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
                    background: activeSessionId === session.session_id ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                    borderLeft: activeSessionId === session.session_id ? '3px solid var(--primary)' : '3px solid transparent',
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
                            background: activeSessionId === session.session_id ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                            borderLeft: activeSessionId === session.session_id ? '3px solid var(--primary)' : '3px solid transparent',
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

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Chat header */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--card)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate(backTarget || 'dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '1.1rem', padding: '0.25rem', lineHeight: 1 }}
            title="Back"
          >←</button>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#000',
            flexShrink: 0,
          }}>IR</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
              DevOps Incident Response
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              4 Agents up
            </div>
          </div>
          
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
                {msg.role === 'bot' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600, color: '#000' }}>AI</div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>MultiAgent · {new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'} style={{ fontSize: '0.875rem', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
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
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600, color: '#000' }}>AI</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Agents analysing...</span>
                </div>
                <div className="chat-bubble-bot" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '1rem' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 1.5rem 1.5rem', width: '100%' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.8rem',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--card-foreground)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--card-foreground)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--card)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Describe your DevOps incident or ask a question..."
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
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: input.trim() && !isTyping ? 'linear-gradient(135deg,#00d4ff,#7c3aed)' : 'var(--muted)',
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
    </div>
  )
}
