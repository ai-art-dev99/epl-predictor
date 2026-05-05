import React from 'react';

const OUTCOME_LABELS = {
  home_win: 'HOME WIN',
  away_win: 'AWAY WIN',
  draw: 'DRAW',
};

const OUTCOME_COLORS = {
  home_win: '#3d9fff',
  away_win: '#00e676',
  draw: '#ffb300',
};

export default function PredictionResult({ result }) {
  const outcomeColor = OUTCOME_COLORS[result.predicted_outcome] || '#3d9fff';
  const homeProb = Math.round(result.home_win_probability * 100);
  const drawProb = Math.round(result.draw_probability * 100);
  const awayProb = Math.round(result.away_win_probability * 100);

  return (
    <div style={{ animation: 'slide-up 0.5s ease' }}>
      {/* Main verdict */}
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${outcomeColor}40`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${outcomeColor}, transparent)`,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          {/* Matchup */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
              PREDICTED RESULT
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{result.home_team}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 28,
                fontWeight: 700,
                color: outcomeColor,
                minWidth: 70,
                textAlign: 'center',
                letterSpacing: 2,
              }}>{result.predicted_score}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{result.away_team}</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: `${outcomeColor}18`,
              border: `1px solid ${outcomeColor}50`,
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13,
              color: outcomeColor,
              letterSpacing: '0.08em',
            }}>
              ⚡ {OUTCOME_LABELS[result.predicted_outcome]}
            </div>
          </div>

          {/* Confidence gauge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
              CONFIDENCE
            </div>
            <ConfidenceRing value={result.confidence} color={outcomeColor} />
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
          PROBABILITY DISTRIBUTION
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: result.home_team, prob: homeProb, color: '#3d9fff', key: 'home_win' },
            { label: 'DRAW', prob: drawProb, color: '#ffb300', key: 'draw' },
            { label: result.away_team, prob: awayProb, color: '#00e676', key: 'away_win' },
          ].map(({ label, prob, color, key }) => (
            <div key={key} style={{
              textAlign: 'center',
              padding: '16px 12px',
              borderRadius: 10,
              background: result.predicted_outcome === key ? `${color}10` : 'var(--bg-secondary)',
              border: `1px solid ${result.predicted_outcome === key ? color + '40' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                {label.length > 14 ? label.split(' ')[0] : label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>
                {prob}%
              </div>
            </div>
          ))}
        </div>

        {/* Bar */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 8 }}>
          <div style={{ width: `${homeProb}%`, background: '#3d9fff', transition: 'width 0.8s ease' }} />
          <div style={{ width: `${drawProb}%`, background: '#ffb300', transition: 'width 0.8s ease' }} />
          <div style={{ width: `${awayProb}%`, background: '#00e676', transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Key factors */}
      {result.key_factors && result.key_factors.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
            KEY FACTORS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.key_factors.map((factor, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 4,
                  background: 'rgba(61,159,255,0.15)',
                  border: '1px solid rgba(61,159,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-blue)', flexShrink: 0,
                }}>0{i + 1}</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
          AI ANALYSIS
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
          borderLeft: '2px solid var(--border-bright)',
          paddingLeft: 16,
        }}>
          {result.analysis}
        </div>
      </div>
    </div>
  );
}

function ConfidenceRing({ value, color }) {
  const pct = Math.round(value * 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;

  return (
    <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto' }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}
