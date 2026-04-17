// ============================================================
//  VANGUARD MD — commands/didyk.js
//  Did You Know — random facts
// ============================================================

const axios    = require('axios')
const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { sock, msg, jid, reply } = ctx

  try {
    const { data } = await axios.get(
      'https://uselessfacts.jsph.pl/random.json?language=en',
      { timeout: 10000 }
    )

    const botName = config.botName || defaults.botName || 'VANGUARD MD'

    await sock.sendMessage(jid, {
      text:
        '🧠 *DID YOU KNOW?*\n' +
        '' + data.text + '\n' +
        '> _' + botName + '_',
    }, { quoted: msg })

  } catch (err) {
    await reply('❌ Could not fetch a fact right now. Try again!')
  }
}
