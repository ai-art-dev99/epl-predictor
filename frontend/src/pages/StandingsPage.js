import React, { useState, useEffect } from 'react';
import { getStandings } from '../utils/api';

const FORM_COLORS = { W: 'form-w', D: 'form-d', L: 'form-l' };

export default function StandingsPage() {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStandings()
      .then(setStandings)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load standings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!standings) return null;

  return (
    <div style={{ animation: 'slide-up 0.5s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.02em', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-primary)' }}>PREMIER </span>
          <span style={{ background: 'linear-gradient(90deg, #3d9fff, #00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEAGUE TABLE</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
          SEASON {standings.season} · MATCHDAY {standings.matchday}
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 48px 48px 48px 48px 48px 48px 56px 100px',
          gap: 0,
          padding: '12px 20px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
        }}>
          <span style={{ textAlign: 'center' }}>POS</span>
          <span>TEAM</span>
          <span style={{ textAlign: 'center' }}>P</span>
          <span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>D</span>
          <span style={{ textAlign: 'center' }}>L</span>
          <span style={{ textAlign: 'center' }}>GF</span>
          <span style={{ textAlign: 'center' }}>GA</span>
          <span style={{ textAlign: 'center' }}>GD</span>
          <span style={{ textAlign: 'center' }}>PTS · FORM</span>
        </div>

        {standings.standings.map((entry, idx) => (
          <div
            key={entry.team_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 48px 48px 48px 48px 48px 48px 56px 100px',
              gap: 0,
              padding: '14px 20px',
              borderBottom: idx < standings.standings.length - 1 ? '1px solid var(--border)' : 'none',
              background: idx < 4 ? 'rgba(61,159,255,0.03)' : idx > 16 ? 'rgba(255,71,87,0.03)' : 'transparent',
              transition: 'background 0.15s',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = idx < 4 ? 'rgba(61,159,255,0.03)' : idx > 16 ? 'rgba(255,71,87,0.03)' : 'transparent'}
          >
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: entry.position <= 4 ? 'var(--accent-blue)'
                : entry.position > 17 ? 'var(--accent-red)'
                : 'var(--text-muted)',
            }}>{entry.position}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {entry.crest_url && (
                <img src={entry.crest_url} alt="" width={22} height={22}
                  style={{ objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <span style={{ fontWeight: 500, fontSize: 14 }}>{entry.team_name}</span>
            </div>

            {[entry.played, entry.won, entry.draw, entry.lost, entry.goals_for, entry.goals_against].map((val, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {val}
              </div>
            ))}

            <div style={{
              textAlign: 'center', fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: entry.goal_difference > 0 ? 'var(--accent-green)'
                : entry.goal_difference < 0 ? 'var(--accent-red)'
                : 'var(--text-secondary)',
            }}>
              {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 15,
                color: entry.position <= 4 ? 'var(--accent-blue)' : 'var(--text-primary)',
                minWidth: 28,
                textAlign: 'right',
              }}>{entry.points}</span>
              {entry.form && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {entry.form.split(',').slice(-5).map((r, i) => (
                    <span key={i} className={FORM_COLORS[r] || ''} style={{
                      width: 16, height: 16, borderRadius: 3,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'var(--accent-blue)' }}>■</span> Champions League
        <span style={{ color: 'var(--accent-red)' }}>■</span> Relegation
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      <span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>⟳</span>
      LOADING STANDINGS...
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 12, padding: 24, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
      ERROR: {message}
    </div>
  );
}
