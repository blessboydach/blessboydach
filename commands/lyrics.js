// ============================================================
// VANGUARD MD — commands/lyrics.js
// Get song lyrics (clean output)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { sock, jid, msg, args } = ctx

  try {
    const query = args.join(' ').trim()

    // ── NO QUERY ────────────────────────────────────────────
    if (!query) {
      return sock.sendMessage(jid, {
        text: '❌ Please provide a song name.\n\nExample: Justin Bieber Baby'
      }, { quoted: msg })
    }

    // ── FETCH LYRICS ────────────────────────────────────────
    const url = `https://apis.xwolf.space/download/lyrics?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url)

    if (!data || !data.success) {
      return sock.sendMessage(jid, {
        text: '❌ Lyrics not found. Try another song.'
      }, { quoted: msg })
    }

    // ── FORMAT OUTPUT ───────────────────────────────────────
    const text =
`Vanguard Md Vibes With You 🎙️

🎵Title : ${data.title}
👤Author ${data.author}
💿Album ${data.album || 'Unknown'}

${data.lyrics.trim()}

> Powered by Vanguard Md`

    await sock.sendMessage(jid, { text }, { quoted: msg })

  } catch (err) {
    console.error('[LYRICS ERROR]', err)
    await sock.sendMessage(jid, {
      text: '❌ Failed to fetch lyrics.\n\nError: ' + err.message
    }, { quoted: msg })
  }
}
