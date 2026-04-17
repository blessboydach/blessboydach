// ============================================================
//  VANGUARD MD — commands/runtime.js
// ============================================================

const { formatUptime } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { sock, jid, msg } = ctx

  const botName = config.botName || defaults.botName || 'VANGUARD MD'
  const uptime  = formatUptime(process.uptime())
  const start   = Date.now()

  const sent = await sock.sendMessage(jid, {
    text: '⏳ _Checking..._'
  }, { quoted: msg })

  const ms = Date.now() - start

  await sock.sendMessage(jid, {
    text:
      '🔹 *Speed:* ' + ms + ' ms 🔸\n' +
      '🔸 *Running For:* ' + uptime + ' 🟢\n' +
      '> _' + botName + ' is on Fire 🔥_',
    edit: sent.key,
  })
}
