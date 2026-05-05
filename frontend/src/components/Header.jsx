import React from 'react'

const NAV = [
  { id: 'predictor', label: 'PREDICT', icon: '⚡' },
  { id: 'standings', label: 'TABLE', icon: '📊' },
  { id: 'fixtures', label: 'FIXTURES', icon: '📅' },
]

export default function Header({ activePage, onNavigate }) {
  return (
    <header style={{
      background: 'rgba(7, 11, 20, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #3d9fff, #00e676)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800,
          }}>⚽</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '0.05em' }}>
              EPL PREDICTOR
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: '0.1em' }}>
              AI-POWERED ANALYSIS
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              background: activePage === item.id ? 'rgba(61, 159, 255, 0.15)' : 'transparent',
              border: activePage === item.id ? '1px solid rgba(61, 159, 255, 0.4)' : '1px solid transparent',
              borderRadius: 6,
              color: activePage === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: 13, letterSpacing: '0.08em', padding: '8px 16px',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)',
            display: 'inline-block', animation: 'pulse-glow 2s infinite',
          }} />
          LIVE DATA
        </div>
      </div>
    </header>
  )
}
