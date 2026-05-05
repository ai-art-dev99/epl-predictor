import React, { useState } from 'react';
import './index.css';
import Header from './components/Header';
import PredictorPage from './pages/PredictorPage';
import StandingsPage from './pages/StandingsPage';
import FixturesPage from './pages/FixturesPage';

export default function App() {
  const [activePage, setActivePage] = useState('predictor');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '32px 24px' }}>
        {activePage === 'predictor' && <PredictorPage />}
        {activePage === 'standings' && <StandingsPage />}
        {activePage === 'fixtures' && <FixturesPage />}
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
      }}>
        EPL PREDICTOR · POWERED BY CLAUDE AI · DATA: FOOTBALL-DATA.ORG
      </footer>
    </div>
  );
}
