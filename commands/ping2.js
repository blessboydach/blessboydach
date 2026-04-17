// ============================================================
//  VANGUARD MD — commands/ping2.js
// ============================================================

const os = require('os')
const { formatUptime, formatBytes } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg } = ctx

  const start = Date.now()
  await sock.sendMessage(jid, { text: '📡 Fetching detailed info...' }, { quoted: msg })
  const ping = Date.now() - start

  const totalMem = os.totalmem()
  const freeMem  = os.freemem()
  const usedMem  = totalMem - freeMem
  const uptime   = formatUptime(process.uptime())
  const cpus     = os.cpus()
  const cpuModel = cpus[0]?.model || 'Unknown'
  const cpuCores = cpus.length

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 📡 *PING 2*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 🏓 *Ping:* ' + ping + 'ms\n' +
    '┃ ⏱️ *Uptime:* ' + uptime + '\n' +
    '┃\n' +
    '┃ 💾 *Memory*\n' +
    '┃ • Total: ' + formatBytes(totalMem) + '\n' +
    '┃ • Used:  ' + formatBytes(usedMem) + '\n' +
    '┃ • Free:  ' + formatBytes(freeMem) + '\n' +
    '┃\n' +
    '┃ 🖥️ *CPU*\n' +
    '┃ • Model: ' + cpuModel + '\n' +
    '┃ • Cores: ' + cpuCores + '\n' +
    '┃\n' +
    '┃ 🟢 Bot is running smoothly!\n' +
    '╰───────────────━⊷'
  )
}
