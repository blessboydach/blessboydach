// ============================================================
//  VANGUARD MD — commands/goodnight.js
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { sock, msg, jid, reply } = ctx

  try {
    const { data } = await axios.get(
      'https://shizoapi.onrender.com/api/texts/lovenight?apikey=shizo',
      { timeout: 10000 }
    )
    await sock.sendMessage(jid, { text: data.result }, { quoted: msg })
  } catch (err) {
    await reply('❌ Failed to get goodnight message. Try again!')
  }
}
