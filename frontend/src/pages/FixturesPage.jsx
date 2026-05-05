import React, { useState, useEffect } from 'react'
import { getUpcomingFixtures, predictMatch } from '../utils/api.js'

function ProbBar({ home, draw, away }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, maxWidth: 200 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3d9fff', minWidth: 32 }}>{Math.round(home * 100)}%</span>
      <div style={{ display: 'flex', flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${home * 100}%`, background: '#3d9fff' }} />
        <div style={{ width: `${draw * 100}%`, background: '#ffb300' }} />
        <div style={{ width: `${away * 100}%`, background: '#00e676' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00e676', minWidth: 32 }}>{Math.round(away * 100)}%</span>
    </div>
  )
}

function ResultBadge({ result }) {
  const colors = { home_win: '#3d9fff', draw: '#ffb300', away_win: '#00e676' }
  const labels = { home_win: 'HOME WIN', draw: 'DRAW', away_win: 'AWAY WIN' }
  const color = colors[result.predicted_outcome] || '#3d9fff'
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '4px 10px', letterSpacing: '0.05em' }}>
      {labels[result.predicted_outcome]}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return 'UPCOMING'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()
  } catch { return dateStr }
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [predicting, setPredicting] = useState(null)
  const [results, setResults] = useState({})

  useEffect(() => {
    getUpcomingFixtures().then(d => setFixtures(d.matches || [])).catch(e => setError(e.response?.data?.detail || 'Failed to load fixtures')).finally(() => setLoading(false))
  }, [])

  const handleQuickPredict = async (match) => {
    const key = match.match_id
    if (results[key] || predicting === key) return
    setPredicting(key)
    try {
      const result = await predictMatch(match.home_team, match.away_team, match.match_date?.split('T')[0])
      setResults(prev => ({ ...prev, [key]: result }))
    } catch {
      setResults(prev => ({ ...prev, [key]: { error: 'Prediction failed' } }))
    } finally {
      setPredicting(null)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⟳ LOADING FIXTURES...</div>

  const grouped = fixtures.reduce((acc, m) => {
    const day = m.match_date?.split('T')[0] || 'Unknown'
    acc[day] = [...(acc[day] || []), m]
    return acc
  }, {})

  return (
    <div style={{ animation: 'slide-up 0.5s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.02em', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-primary)' }}>UPCOMING </span>
          <span style={{ background: 'linear-gradient(90deg, #3d9fff, #00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FIXTURES</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Click any match to get an instant AI prediction.</p>
      </div>

      {error && <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 12, padding: 24, color: 'var(--accent-red)', marginBottom: 24 }}>{error}</div>}

      {Object.entries(grouped).map(([date, matches]) => (
        <div key={date} style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            {formatDate(date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.map(match => {
              const key = match.match_id
              const result = results[key]
              const isLoading = predicting === key
              return (
                <div key={key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 24px', cursor: result ? 'default' : 'pointer', transition: 'border-color 0.2s' }}
                  onClick={() => !result && handleQuickPredict(match)}
                  onMouseEnter={e => { if (!result) e.currentTarget.style.borderColor = 'var(--accent-blue)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {match.home_crest && <img src={match.home_crest} alt="" width={28} height={28} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />}
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{match.home_team}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>vs</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{match.away_team}</span>
                      {match.away_crest && <img src={match.away_crest} alt="" width={28} height={28} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>MD {match.matchday} · {match.match_date?.split('T')[1]?.slice(0, 5) || ''}</span>
                      {isLoading ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue)', animation: 'pulse-glow 1s infinite' }}>ANALYZING...</span>
                      ) : result?.error ? (
                        <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>Failed</span>
                      ) : result ? (
                        <ResultBadge result={result} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', background: 'rgba(61,159,255,0.1)', border: '1px solid rgba(61,159,255,0.3)', borderRadius: 4, padding: '4px 10px' }}>⚡ PREDICT</span>
                      )}
                    </div>
                  </div>
                  {result && !result.error && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>SCORE:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent-blue)' }}>{result.predicted_score}</span>
                      <ProbBar home={result.home_win_probability} draw={result.draw_probability} away={result.away_win_probability} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence: {Math.round(result.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
