// ============================================================
//  VANGUARD MD — commands/gemini.js
//  Official Google Gemini 2.5 Flash (Direct API - No SDK Issues)
// ============================================================

const axios = require('axios')

// ── YOUR HARD CODED GEMINI API KEY ─────────────────────────
const GEMINI_API_KEY = "AIzaSyBlJb8FHMRsCcSHVLuT4-A11ga9VPlYUSA"

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, args } = ctx

  const query = args.join(' ').trim()

  if (!query) {
    return reply(
      '🌟 *Gemini*\n' +
      '_Usage: .gemini <your question>_\n' +
      '_Example: .gemini explain quantum physics_\n' +
      ''
    )
  }

  // Send thinking status (will be edited)
  let statusMsg = await sock.sendMessage(jid, {
    text: '\n' +
          '🌟 Gemini Started\n' +
          'Status: Thinking 🧠\n' +
          ''
  }, { quoted: msg })

  try {
    const { data } = await axios.post(GEMINI_URL, {
      contents: [{
        parts: [{ text: query }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    })

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini 😭"

    await sock.sendMessage(jid, {
      text: '\n' +
            '🌟 *Gemini*\n' +
            '❓ *Query:* ' + query + '\n' +
            '' + answer.split('\n').join('\n') + '\n' +
            '_Powered by Vanguard MD 🔥_',
      edit: statusMsg.key
    })

  } catch (err) {
    console.error('[Gemini Error]', err.message || err)

    await sock.sendMessage(jid, {
      text: '\n' +
            '❌ Gemini Error\n' +
            '' + (err.message || 'Something went wrong') + '\n' +
            '',
      edit: statusMsg.key
    })
  }
}
