// ============================================================
//  VANGUARD MD — lib/aihelper.js
//  Shared AI core — used by gpt, llama, meta, grok, claude
// ============================================================

const axios = require('axios')

// ── API chain ─────────────────────────────────────────────────
const AI_APIS = [
  (q) => 'https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q),
  (q) => 'https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q),
  (q) => 'https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=' + encodeURIComponent(q),
]

const askAI = async (query) => {
  for (const apiUrl of AI_APIS) {
    try {
      const { data } = await axios.get(apiUrl(query), { timeout: 15000 })
      const response = data?.data?.response
      if (response && typeof response === 'string' && response.trim()) {
        return response.trim()
      }
    } catch (_) { continue }
  }
  throw new Error('All AI APIs failed')
}

// ── Shared handler ────────────────────────────────────────────
// Each plugin passes its own header branding
module.exports = async (ctx, { emoji, name, color }) => {
  const { sock, msg, jid, args, reply } = ctx

  const query = args.join(' ').trim()

  if (!query) return reply(
    '╭───────────────━⊷\n' +
    '┃ ' + emoji + ' *' + name + '*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ _Usage: .' + ctx.command + ' <your question>_\n' +
    '┃ _Example: .' + ctx.command + ' explain quantum physics_\n' +
    '╰───────────────━⊷'
  )

  await reply('*_Thinking 🧠_*')

  let answer
  try {
    answer = await askAI(query)
  } catch (err) {
    return reply('❌ Failed to get AI response. Please try again later.')
  }

  await reply(
    '╭───────────────━⊷\n' +
    '┃ ' + emoji + ' *' + name + '*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ ❓ *Query:* ' + query + '\n' +
    '┃\n' +
    '┃ ' + answer.split('\n').join('\n┃ ') + '\n' +
    '╰───────────────━⊷'
  )
}
