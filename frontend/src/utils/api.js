import axios from 'axios'

// In dev: Vite proxies /api → backend:8000
// In prod (Docker): nginx proxies /api → backend:8000
const API_BASE = ''

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export const predictMatch = async (homeTeam, awayTeam, matchDate = null) => {
  const { data } = await api.post('/predict', {
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
  })
  return data
}

export const getStandings = async () => {
  const { data } = await api.get('/standings')
  return data
}

export const getUpcomingFixtures = async () => {
  const { data } = await api.get('/fixtures/upcoming')
  return data
}

export const getTeams = async () => {
  const { data } = await api.get('/teams')
  return data
}

export const getStats = async () => {
  const { data } = await axios.get('/stats')
  return data
}

export const checkHealth = async () => {
  const { data } = await axios.get('/health')
  return data
}
