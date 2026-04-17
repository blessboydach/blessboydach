// ============================================================
//  VANGUARD MD — lib/football.js
//  General Football Data Helper (football-data.org)
//  Uses both your tokens + automatic fallback + rate limit handling
// ============================================================

const axios = require('axios')

// ── Your two API tokens ─────────────────────────────────────
const TOKENS = [
  '8ed6a61e7dd94c2d95f6d5b4e0a98a1e',   // vanguardmdbot
  'd5fc19bc777e4900934c84778d211e19'    // dach’s deogracious
]

let tokenIndex = 0

const getToken = () => {
  const token = TOKENS[tokenIndex]
  tokenIndex = (tokenIndex + 1) % TOKENS.length
  return token
}

const api = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  timeout: 12000
})

const request = async (endpoint) => {
  const token = getToken()

  try {
    const { data, headers } = await api.get(endpoint, {
      headers: { 'X-Auth-Token': token }
    })

    // Optional debug log for rate limits
    if (headers['x-ratelimit-remaining']) {
      console.log(`[Football API] Remaining: ${headers['x-ratelimit-remaining']} | Token: ${token.slice(0,8)}...`)
    }

    return data
  } catch (err) {
    if (err.response?.status === 429) {
      // Rate limited → instantly try the other token
      console.log(`[Football API] Rate limit hit → switching token`)
      return request(endpoint)
    }
    throw err
  }
}

// ── League code shortcuts (all free leagues you have access to) ──
const LEAGUE_CODES = {
  'pl': 'PL', 'epl': 'PL', 'premier': 'PL',
  'cl': 'CL', 'champions': 'CL',
  'laliga': 'PD', 'pd': 'PD',
  'bundesliga': 'BL1', 'bl1': 'BL1',
  'seriea': 'SA', 'sa': 'SA',
  'ligue1': 'FL1', 'fl1': 'FL1',
  'eredivisie': 'DED', 'ded': 'DED',
  'primeiraliga': 'PPL', 'ppl': 'PPL',
  'championship': 'ELC', 'elc': 'ELC',
  'brasileirao': 'BSA', 'bsa': 'BSA',
  'worldcup': 'WC', 'wc': 'WC',
  'euro': 'EC', 'ec': 'EC'
}

module.exports = {
  request,
  LEAGUE_CODES,

  // Main functions used by all commands
  getStandings: (code) => request(`/competitions/${code}/standings`),
  getFixtures: (code, days = 10) => request(`/competitions/${code}/matches?dateFrom=${new Date().toISOString().split('T')[0]}&dateTo=${new Date(Date.now() + days * 86400000).toISOString().split('T')[0]}`),
  getResults: (code) => request(`/competitions/${code}/matches?status=FINISHED&limit=20`),
  getLiveMatches: () => request('/matches?status=LIVE,IN_PLAY'),
  getTopScorers: (code) => request(`/competitions/${code}/scorers?limit=10`),
  getLeagueList: () => request('/competitions')
}