import { useState, useRef, useEffect } from 'react'

const REPO_RESPONSES = [
  (url) => `🔍 **Connecting to repository:** \`${url}\`\n\nCloning and indexing repository structure...\n- 847 files discovered\n- 12 microservices detected\n- 3 CI/CD workflows found\n- Docker configuration analysed`,
  () => `📊 **Repository Analysis Complete**\n\n**Code Quality Score: 73/100**\n\n🟡 Issues Found:\n- 14 high-severity security vulnerabilities in dependencies\n- Missing health check endpoints in 4 services\n- No rate limiting on public API routes\n- Hard-coded credentials detected in \`config/staging.yml\``,
  () => `🛡️ **Security Report**\n\n- \`lodash@4.17.15\` — Prototype pollution (CVE-2021-23337)\n- \`express@4.17.1\` — Path traversal vulnerability\n- \`axios@0.21.0\` — SSRF vulnerability\n\nRecommend: Run \`npm audit fix\` and pin dependency versions.`,
  () => `⚙️ **DevOps Best Practices**\n\n✅ Passing:\n- Multi-stage Docker builds\n- Kubernetes readiness probes\n- Prometheus metrics endpoint\n\n❌ Missing:\n- No Helm charts for deployment\n- No horizontal pod autoscaling\n- Missing network policies\n- No service mesh configuration`,
  (msg) => `Regarding your question about "${msg}": Based on the repository analysis, the codebase shows signs of technical debt in this area. I recommend reviewing the architecture documentation and implementing the suggested improvements in the next sprint.`,
]

let repoRespIdx = 0

function getRepoResponse(msg) {
  const fn = REPO_RESPONSES[Math.min(repoRespIdx, REPO_RESPONSES.length - 1)]
  repoRespIdx++
  return fn(msg)
}

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    const codeLine = boldLine.replace(/`(.*?)`/g, '<code style="background:rgba(168,85,247,0.12);border-radius:3px;padding:0.1em 0.3em;font-family:JetBrains Mono,monospace;font-size:0.85em;color:#a855f7;">$1</code>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: codeLine }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function RepoAnalysisPage({ navigate }) {
  const [step, setStep] = useState('url') // 'url' | 'chat'
  const [repoUrl, setRepoUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleAnalyse = () => {
    const trimmed = repoUrl.trim()
    if (!trimmed) { setUrlError('Please enter a GitHub URL.'); return }
    if (!trimmed.includes('github.com')) { setUrlError('Please enter a valid GitHub repository URL.'); return }
    setUrlError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      repoRespIdx = 0
      setStep('chat')
      setMessages([{
        role: 'bot',
        text: `Repository connected: \`${trimmed}\`\n\nOur agent network is scanning your repository. You can ask questions while analysis runs in the background.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          const resp = getRepoResponse(trimmed)
          setIsTyping(false)
          setMessages(m => [...m, { role: 'bot', text: resp, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
        }, 2200)
      }, 500)
    }, 1500)
  }

  const sendMessage = () => {
    if (!input.trim() || isTyping) return
    const currentInput = input.trim()
    setMessages(m => [...m, { role: 'user', text: currentInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const resp = getRepoResponse(currentInput)
      setIsTyping(false)
      setMessages(m => [...m, { role: 'bot', text: resp, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    }, 1800 + Math.random() * 700)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (step === 'url') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.2, pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted-foreground)'}
          >← Back to Dashboard</button>

          <div className="glass" style={{ borderRadius: 16, padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: 52, height: 52,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 30px rgba(168,85,247,0.3)',
              }}>🔍</div>
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
                  onClick={() => setRepoUrl(`https://${ex}`)}
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
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '4rem' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', position: 'sticky', top: 64, zIndex: 10 }}>
        <button onClick={() => { setStep('url'); repoRespIdx = 0 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '1.1rem', padding: '0.25rem' }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🔍</div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>Repository Analysis</div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{repoUrl}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {['Security', 'Quality', 'CI/CD'].map(a => (
            <span key={a} style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.2rem 0.6rem', borderRadius: 4, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--accent)' }}>{a}</span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800, width: '100%', margin: '0 auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
            {msg.role === 'bot' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🔍</div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>RepoAgent · {msg.time}</span>
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
              <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>You · {msg.time}</span>
            )}
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🔍</div>
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

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--card)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask anything about this repository..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120, borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.5, padding: '0.65rem 1rem', background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{ width: 44, height: 44, borderRadius: 10, background: input.trim() && !isTyping ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--muted)', border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff', transition: 'all 0.2s', flexShrink: 0 }}
          >↑</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.6rem', fontFamily: 'Inter, sans-serif' }}>
          Press <kbd style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--muted)', padding: '0 4px', borderRadius: 3, border: '1px solid var(--border)' }}>Enter</kbd> to send
        </p>
      </div>
    </div>
  )
}
