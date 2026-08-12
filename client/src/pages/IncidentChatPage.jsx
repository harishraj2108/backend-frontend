import { useState, useRef, useEffect } from 'react'

const BOT_RESPONSES = [
  (msg) => `🔍 **Analysing incident:** "${msg}"\n\nTriage Agent has classified this as a **HIGH severity** infrastructure incident. I'm engaging 4 specialized agents to diagnose and remediate.`,
  () => `⚡ **Root Cause Identified**\n\nDiagnosis Agent has completed the analysis:\n- Primary cause: Memory pressure in pod \`auth-service-7d9f8\`\n- Upstream effect: Increased latency in API gateway (p99: 2.3s)\n- Affected services: 3 downstream dependencies\n\nConfidence: 94%`,
  () => `🔧 **Remediation Plan Generated**\n\n1. Scale \`auth-service\` replicas: 2 → 6\n2. Set memory limits to 512Mi → 1Gi\n3. Restart degraded pods in rolling fashion\n4. Enable circuit breaker on API gateway\n\nShall I execute this plan automatically?`,
  () => `✅ **Incident Resolved**\n\nAll remediation steps completed in **31 seconds**.\n- Latency p99: 2.3s → 180ms\n- Error rate: 4.2% → 0.01%\n- SLA impact: Negligible\n\nPost-mortem report generated. 📋`,
  (msg) => `I've processed your query about "${msg}". Here's what our agent network found:\n\nBased on the current infrastructure state and historical incident patterns, this appears to be related to resource contention during peak load. Would you like me to run a deeper analysis?`,
]

let responseIdx = 0

function getResponse(msg) {
  const fn = BOT_RESPONSES[Math.min(responseIdx, BOT_RESPONSES.length - 1)]
  responseIdx++
  return fn(msg)
}

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    const codeLine = boldLine.replace(/`(.*?)`/g, '<code style="background:rgba(0,212,255,0.1);border-radius:3px;padding:0.1em 0.3em;font-family:JetBrains Mono,monospace;font-size:0.85em;color:#00d4ff;">$1</code>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: codeLine }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function IncidentChatPage({ navigate }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm your DevOps Incident Response Assistant, powered by a network of specialized agents.\n\nDescribe your incident, ask about infrastructure issues, deployment failures, monitoring alerts, or any DevOps challenge — I'm here to help diagnose and resolve it.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = () => {
    if (!input.trim() || isTyping) return
    const userMsg = { role: 'user', text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const currentInput = input.trim()
    setMessages(m => [...m, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const botText = getResponse(currentInput)
      setIsTyping(false)
      setMessages(m => [...m, { role: 'bot', text: botText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    }, 1800 + Math.random() * 800)
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '4rem' }}>
      {/* Chat header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'var(--card)',
        position: 'sticky',
        top: 64,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate('dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '1.1rem', padding: '0.25rem', lineHeight: 1 }}
          title="Back"
        >←</button>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>🚨</div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
            DevOps Incident Response
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            5 Agents Ready
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {['Triage', 'Diagnose', 'Remediate'].map((a, i) => (
            <span key={a} style={{
              fontSize: '0.7rem',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '0.2rem 0.6rem',
              borderRadius: 4,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.15)',
              color: 'var(--primary)',
            }}>{a}</span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800, width: '100%', margin: '0 auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
            {msg.role === 'bot' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🤖</div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>MultiAgent · {msg.time}</span>
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'} style={{ fontSize: '0.875rem', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
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
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🤖</div>
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

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ padding: '0 1.5rem 1rem', maxWidth: 800, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
  )
}
