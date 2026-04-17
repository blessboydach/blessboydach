// ============================================================
//  VANGUARD MD — commands/flirt.js
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { msg, jid, sock, reply } = ctx

  try {
    const { data } = await axios.get(
      'https://shizoapi.onrender.com/api/texts/flirt?apikey=shizo',
      { timeout: 10000 }
    )
    await sock.sendMessage(jid, { text: data.result }, { quoted: msg })
  } catch (err) {
    await reply('❌ Failed to get flirt message. Try again!')
  }
}
