import React, { useState } from 'react'
import { predictMatch } from '../utils/api.js'
import PredictionResult from '../components/PredictionResult.jsx'

const EPL_TEAMS = [
  'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton & Hove Albion',
  'Chelsea','Crystal Palace','Everton','Fulham','Ipswich Town',
  'Leicester City','Liverpool','Manchester City','Manchester United',
  'Newcastle United','Nottingham Forest','Southampton','Tottenham Hotspur',
  'West Ham United','Wolverhampton Wanderers'
]

const QUICK_PICKS = [
  ['Arsenal','Liverpool'],['Manchester City','Chelsea'],
  ['Tottenham Hotspur','Manchester United'],['Newcastle United','Aston Villa'],
]

const selectStyle = {
  width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 15,
  fontFamily: 'var(--font-body)', padding: '12px 16px', outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5f7a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40,
}

export default function PredictorPage() {
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [agentSteps, setAgentSteps] = useState([])

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) { setError('Please select both teams'); return }
    if (homeTeam === awayTeam) { setError('Home and away teams must be different'); return }

    setLoading(true); setError(''); setResult(null)
    const steps = [
      'Fetching EPL standings...',
      `Analyzing ${homeTeam} recent form...`,
      `Analyzing ${awayTeam} recent form...`,
      'Checking head-to-head history...',
      'Running AI analysis...',
    ]
    setAgentSteps(steps.map(s => ({ step: s, done: false })))

    const timers = [1200, 2800, 4400, 6000, 7500].map((delay, i) =>
      setTimeout(() => setAgentSteps(prev => prev.map((s, idx) => idx === i ? { ...s, done: true } : s)), delay)
    )

    try {
      const data = await predictMatch(homeTeam, awayTeam)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Check your API keys and try again.')
    } finally {
      setLoading(false)
      timers.forEach(clearTimeout)
      setAgentSteps([])
    }
  }

  return (
    <div style={{ animation: 'slide-up 0.5s ease' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-primary)' }}>MATCH </span>
          <span style={{ background: 'linear-gradient(90deg, #3d9fff, #00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PREDICTOR</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520 }}>
          AI agent analyzes live standings, team form, and head-to-head records to predict EPL match outcomes.
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>HOME TEAM</label>
            <select value={homeTeam} onChange={e => { setHomeTeam(e.target.value); setResult(null); setError('') }} style={selectStyle}>
              <option value="">Select team...</option>
              {EPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-muted)', paddingBottom: 12 }}>VS</div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>AWAY TEAM</label>
            <select value={awayTeam} onChange={e => { setAwayTeam(e.target.value); setResult(null); setError('') }} style={selectStyle}>
              <option value="">Select team...</option>
              {EPL_TEAMS.filter(t => t !== homeTeam).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>QUICK PICKS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_PICKS.map(([h, a]) => (
              <button key={`${h}-${a}`} onClick={() => { setHomeTeam(h); setAwayTeam(a); setResult(null) }} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'var(--font-body)', padding: '6px 12px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-blue)'; e.target.style.color = 'var(--accent-blue)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
              >{h} vs {a}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, padding: '12px 16px', color: 'var(--accent-red)', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={handlePredict} disabled={loading || !homeTeam || !awayTeam} style={{
          width: '100%', padding: 16,
          background: loading || !homeTeam || !awayTeam ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #1a6fd4, #0ba360)',
          border: 'none', borderRadius: 10,
          color: loading || !homeTeam || !awayTeam ? 'var(--text-muted)' : 'white',
          cursor: loading || !homeTeam || !awayTeam ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em',
          transition: 'all 0.2s',
          boxShadow: loading || !homeTeam || !awayTeam ? 'none' : '0 4px 20px rgba(61,159,255,0.3)',
        }}>
          {loading ? '⚡ AGENT ANALYZING...' : '⚡ PREDICT MATCH'}
        </button>
      </div>

      {loading && agentSteps.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 32, animation: 'fade-in 0.3s ease' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', letterSpacing: '0.1em', marginBottom: 16 }}>AI AGENT WORKING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {agentSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: step.done ? 'rgba(0,230,118,0.2)' : 'rgba(61,159,255,0.1)',
                  border: `1px solid ${step.done ? 'var(--accent-green)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, flexShrink: 0, transition: 'all 0.3s',
                }}>
                  {step.done ? '✓' : <span style={{ color: 'var(--accent-blue)', animation: 'pulse-glow 1s infinite' }}>●</span>}
                </div>
                <span style={{ fontSize: 13, color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{step.step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && <PredictionResult result={result} />}
    </div>
  )
}
