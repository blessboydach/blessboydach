// ============================================================
//  VANGUARD MD — commands/vangai.js
//  AI assistant — Gemini chain + GPT fallback + new APIs
// ============================================================

const axios   = require('axios')
const config   = require('../config')
const defaults = require('../defaults')

// ── Gemini API chain (primary) ────────────────────────────────
const geminiApis = [
  async (q) => {
    const r = await axios.get('https://vapis.my.id/api/gemini?q=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://api.siputzx.my.id/api/ai/gemini-pro?content=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://api.ryzendesu.vip/api/ai/gemini?text=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://zellapi.autos/ai/chatbot?text=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.message || r.data?.data || r.data?.answer || r.data?.result
    if (a) return a
    throw new Error('no answer')
  },
  // ── New APIs from aihelper ────────────────────────────────
  async (q) => {
    const r = await axios.get('https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.data?.response
    if (a && typeof a === 'string' && a.trim()) return a.trim()
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.data?.response
    if (a && typeof a === 'string' && a.trim()) return a.trim()
    throw new Error('no answer')
  },
  async (q) => {
    const r = await axios.get('https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q), { timeout: 15000 })
    const a = r.data?.data?.response
    if (a && typeof a === 'string' && a.trim()) return a.trim()
    throw new Error('no answer')
  },
]

// ── GPT fallback (final) ──────────────────────────────────────
const gptFallback = async (q) => {
  const r = await axios.get('https://zellapi.autos/ai/chatbot?text=' + encodeURIComponent(q), { timeout: 15000 })
  const a = r.data?.result || r.data?.message || r.data?.data || r.data?.answer
  if (a) return a
  throw new Error('GPT fallback failed')
}

const getAiAnswer = async (query) => {
  for (const api of geminiApis) {
    try {
      const answer = await api(query)
      if (answer) return answer
    } catch (_) {}
  }
  return await gptFallback(query)
}

module.exports = async (ctx) => {
  const { args, reply } = ctx

  const query   = args.join(' ').trim()
  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  if (!query) return reply(
    '╭───────────────━⊷\n' +
    '┃ 🤖 *VANGAI — AI ASSISTANT*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ _Usage: .vangai <your question>_\n' +
    '┃ _Example: .vangai explain quantum physics_\n' +
    '╰───────────────━⊷'
  )

  await reply('*_Thinking 🧠_*')

  let answer
  try {
    answer = await getAiAnswer(query)
  } catch (err) {
    return reply('❌ All AI sources failed. Please try again later.')
  }

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🤖 *VANGAI*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ ❓ *Query:* ' + query + '\n' +
    '┃\n' +
    '┃ ' + answer.split('\n').join('\n┃ ') + '\n' +
    '╰───────────────━⊷\n' +
    '> _Powered by ' + botName + '_ 🔥'
  )
}
