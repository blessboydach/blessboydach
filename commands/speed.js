// ============================================================
//  VANGUARD MD — commands/speed.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { sock, jid, msg } = ctx

  const botName = config.botName || defaults.botName || 'VANGUARD MD'
  const start   = Date.now()

  const sent = await sock.sendMessage(jid, {
    text: '🔸 Checking !🔹'
  }, { quoted: msg })

  const ms = Date.now() - start

  await sock.sendMessage(jid, {
    text:  '🔸 *' + botName + '* 🔹\n⚡️ *Latency:* ' + ms + ' ms',
    edit:  sent.key,
  })
}
