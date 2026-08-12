import { useEffect, useRef, useState } from 'react'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Autonomous Incident Detection',
    desc: 'AI agents continuously monitor your infrastructure, detecting anomalies and incidents in real-time before they escalate into critical failures.',
  },
  {
    icon: '🔗',
    title: 'Interoperable Agent Network',
    desc: 'Multiple specialized agents collaborate using standardized protocols — triage, diagnosis, remediation, and escalation agents working in concert.',
  },
  {
    icon: '🧠',
    title: 'Contextual Root Cause Analysis',
    desc: 'Deep reasoning across logs, metrics, traces, and topology data to pinpoint the exact root cause with precision and speed.',
  },
  {
    icon: '🔄',
    title: 'Automated Remediation',
    desc: 'Self-healing playbooks execute automatically — scaling resources, rolling back deployments, and restoring services without human intervention.',
  },
  {
    icon: '📊',
    title: 'Observability Integration',
    desc: 'Native connectors to Prometheus, Grafana, Datadog, PagerDuty, and major cloud providers for unified visibility.',
  },
  {
    icon: '🛡️',
    title: 'Audit & Compliance',
    desc: 'Every agent decision is logged with full reasoning chains for compliance, post-mortems, and continuous improvement of response playbooks.',
  },
]

const QUESTIONS = [
  'What is the blast radius of this database failure?',
  'Which microservices are affected by latency spikes in the API gateway?',
  'What triggered this memory leak in the auth service?',
  'How do I roll back the failed canary deployment in production?',
  'Why is the CI/CD pipeline failing on the staging environment?',
  'What is the SLA impact of the current Kubernetes node crash?',
  'How long until auto-scaling resolves this traffic surge?',
  'Which on-call engineer should be paged for this severity-1 incident?',
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Incident Detected', desc: 'Monitoring agents surface anomalies across infrastructure metrics, logs, and traces.' },
  { step: '02', title: 'Triage & Classification', desc: 'Triage agents classify severity, scope, and affected components using historical patterns.' },
  { step: '03', title: 'Root Cause Analysis', desc: 'Diagnostic agents traverse the dependency graph to isolate root causes with confidence scores.' },
  { step: '04', title: 'Autonomous Remediation', desc: 'Remediation agents execute the optimal playbook — scaling, patching, or escalating to humans.' },
]

function Particle({ style }) {
  return <div className="particle" style={style} />
}

function AnimatedQuestion() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    const question = QUESTIONS[idx]
    if (charIdx < question.length) {
      const t = setTimeout(() => {
        setDisplayed(question.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      }, 40)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setCharIdx(0)
        setDisplayed('')
        setIdx(i => (i + 1) % QUESTIONS.length)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [charIdx, idx])

  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.95rem',
      color: 'var(--primary)',
      minHeight: '1.6em',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span style={{ color: 'var(--muted-foreground)' }}>&gt;</span>
      <span>{displayed}</span>
      <span className="animate-blink" style={{ width: 2, height: '1.2em', background: 'var(--primary)', display: 'inline-block', verticalAlign: 'text-bottom' }} />
    </div>
  )
}

function AgentOrbit() {
  const agents = [
    { label: 'Triage', angle: 0, color: '#00d4ff' },
    { label: 'Diagnose', angle: 72, color: '#a855f7' },
    { label: 'Remediate', angle: 144, color: '#7c3aed' },
    { label: 'Escalate', angle: 216, color: '#06b6d4' },
    { label: 'Report', angle: 288, color: '#8b5cf6' },
  ]

  const r = 130

  return (
    <div style={{ position: 'relative', width: 320, height: 320, flexShrink: 0 }}>
      {/* Orbit rings */}
      {[160, 120, 80].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size * 2,
          height: size * 2,
          borderRadius: '50%',
          border: `1px solid rgba(0, 212, 255, ${0.05 + i * 0.03})`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }} />
      ))}

      {/* Center core */}
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        boxShadow: '0 0 30px rgba(0,212,255,0.4)',
        zIndex: 2,
      }}>🤖</div>

      {/* Agent nodes */}
      {agents.map((agent, i) => {
        const rad = (agent.angle * Math.PI) / 180
        const x = Math.cos(rad) * r + 160 - 28
        const y = Math.sin(rad) * r + 160 - 28
        return (
          <div
            key={agent.label}
            className="animate-float"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--card)',
              border: `2px solid ${agent.color}40`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: agent.color,
              fontWeight: 500,
              boxShadow: `0 0 16px ${agent.color}20`,
              animationDelay: `${i * 1.2}s`,
              zIndex: 2,
            }}
          >
            <div style={{ fontSize: '1rem', marginBottom: 2 }}>
              {['⚡', '🔍', '🔧', '📢', '📋'][i]}
            </div>
            <span>{agent.label}</span>
          </div>
        )
      })}

      {/* Connector lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {agents.map((agent, i) => {
          const rad = (agent.angle * Math.PI) / 180
          const x = Math.cos(rad) * r + 160
          const y = Math.sin(rad) * r + 160
          return (
            <line
              key={i}
              x1="160" y1="160"
              x2={x} y2={y}
              stroke={agent.color}
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeDasharray="4 4"
            />
          )
        })}
      </svg>
    </div>
  )
}

export default function HomePage({ navigate }) {
  const heroRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDuration: `${8 + Math.random() * 12}s`,
    animationDelay: `${Math.random() * 10}s`,
    opacity: 0.3 + Math.random() * 0.4,
    background: i % 2 === 0 ? '#00d4ff' : '#a855f7',
    width: `${1 + Math.random() * 2}px`,
    height: `${1 + Math.random() * 2}px`,
  }))

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* HERO */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: '6rem',
        }}
      >
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Cursor glow */}
        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          pointerEvents: 'none',
          transition: 'left 0.1s ease, top 0.1s ease',
        }} />

        {/* Particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {particles.map((p, i) => (
            <div key={i} className="particle" style={p} />
          ))}
        </div>

        {/* Grid lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: 0.3,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Left content */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div className="animate-slide-up" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 20,
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--primary)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', animation: 'pulse-glow 2s infinite' }} />
              NexAgent v2.0 — Live
            </div>

            <h1 className="animate-slide-up delay-100" style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
              color: 'var(--foreground)',
            }}>
              Autonomous<br />
              <span className="gradient-text">DevOps Incident</span><br />
              Response
            </h1>

            <p className="animate-slide-up delay-200" style={{
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
              maxWidth: 520,
              marginBottom: '2rem',
            }}>
              An interoperable network of AI agents that detects, diagnoses, and autonomously resolves infrastructure incidents — at the speed of machines, with the intelligence of your best SRE.
            </p>

            {/* Typewriter question box */}
            <div className="animate-slide-up delay-300" style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                // Ask the system anything...
              </div>
              <AnimatedQuestion />
            </div>

            <div className="animate-slide-up delay-400" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('login')}>
                <span>Get Started →</span>
              </button>
              <button className="btn-outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                How It Works
              </button>
            </div>

            <div className="animate-slide-up delay-500" style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {[['99.9%', 'Uptime SLA'], ['<30s', 'Avg Detection'], ['5x', 'Faster MTTR']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{val}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontFamily: 'Inter, sans-serif' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Agent Orbit */}
          <div className="animate-fade-in delay-300" style={{ display: 'flex', justifyContent: 'center' }}>
            <AgentOrbit />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '6rem 0', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              WORKFLOW
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '4rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  opacity: 0.06,
                  lineHeight: 1,
                }}>
                  {item.step}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem', opacity: 0.8 }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '6rem 0', background: 'var(--muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              CAPABILITIES
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
              Everything Your DevOps Team Needs
            </h2>
            <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)', maxWidth: 520, margin: '1rem auto 0', lineHeight: 1.7 }}>
              A complete platform for autonomous incident response, built for teams that can't afford downtime.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1))',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVOPS Q&A SECTION */}
      <section style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              INTELLIGENCE
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)', marginBottom: '1.25rem' }}>
              Ask Any DevOps Question
            </h2>
            <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7, marginBottom: '2rem' }}>
              Our multi-agent system understands the full stack — from Kubernetes pods to database transactions, from CI/CD pipelines to cloud networking. No question is too complex.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Infrastructure failures & cascading issues', 'Deployment rollbacks & canary analysis', 'Performance bottlenecks & capacity planning', 'Security incidents & compliance violations'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--card-foreground)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, lineHeight: 1.5 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn-primary" onClick={() => navigate('login')} style={{ marginTop: '2rem' }}>
              <span>Try the AI Assistant →</span>
            </button>
          </div>

          {/* Mock terminal */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'var(--muted)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border)',
            }}>
              {['#ff5f57', '#ffbd2e', '#28c840'].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
                agent-console — incident-response
              </span>
            </div>
            <div style={{ padding: '1.25rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.8 }}>
              {[
                { role: 'system', text: 'MultiAgent v2.0 connected · 5 agents active' },
                { role: 'user', text: '> DB latency spike detected in prod-us-east-1' },
                { role: 'triage', text: '[TRIAGE] Severity: HIGH · DB cluster affected' },
                { role: 'diag', text: '[DIAGNOSE] Root cause: connection pool exhaustion' },
                { role: 'fix', text: '[REMEDIATE] Scaling pool 50→200, ETA 23s' },
                { role: 'result', text: '✓ Latency restored · Incident auto-closed' },
              ].map((line, i) => (
                <div key={i} style={{ color: line.role === 'user' ? 'var(--primary)' : line.role === 'result' ? '#28c840' : line.role === 'system' ? 'var(--muted-foreground)' : 'var(--card-foreground)' }}>
                  {line.text}
                </div>
              ))}
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span>&gt;</span>
                <span className="animate-blink" style={{ width: 7, height: 14, background: 'var(--primary)', display: 'inline-block' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 0', background: 'var(--muted)', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--foreground)', marginBottom: '1.25rem' }}>
            Ready to Eliminate<br />
            <span className="gradient-text">Manual Incident Response?</span>
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Join engineering teams who've reduced MTTR by 5x and eliminated 90% of manual triage work.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('login')}>
              <span>Start Free Trial</span>
            </button>
            <button className="btn-outline">Request a Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
          © 2026 NexAgent — Autonomous DevOps Incident Response Platform
        </div>
      </footer>
    </div>
  )
}
