// ============================================================
//  VANGUARD MD — commands/status.js
// ============================================================

const os = require('os')
const { formatBytes, formatUptime } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx

  const platform   = os.platform()
  const release    = os.release()
  const arch       = os.arch()
  const hostname   = os.hostname()
  const totalMem   = os.totalmem()
  const freeMem    = os.freemem()
  const usedMem    = totalMem - freeMem
  const memPercent = ((usedMem / totalMem) * 100).toFixed(1)
  const uptime     = formatUptime(os.uptime())
  const botUptime  = formatUptime(process.uptime())
  const nodeVersion = process.version
  const cpus       = os.cpus()
  const cpuModel   = cpus[0]?.model || 'Unknown'

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 📊 *SYSTEM STATUS*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 🖥️ *OS Info*\n' +
    '┃ • Platform: ' + platform + '\n' +
    '┃ • Release: ' + release + '\n' +
    '┃ • Arch: ' + arch + '\n' +
    '┃ • Hostname: ' + hostname + '\n' +
    '┃\n' +
    '┃ 💾 *Memory*\n' +
    '┃ • Total: ' + formatBytes(totalMem) + '\n' +
    '┃ • Used:  ' + formatBytes(usedMem) + ' (' + memPercent + '%)\n' +
    '┃ • Free:  ' + formatBytes(freeMem) + '\n' +
    '┃\n' +
    '┃ 🖥️ *CPU*\n' +
    '┃ • ' + cpuModel + '\n' +
    '┃ • Cores: ' + cpus.length + '\n' +
    '┃\n' +
    '┃ ⏱️ *Uptime*\n' +
    '┃ • System: ' + uptime + '\n' +
    '┃ • Bot: ' + botUptime + '\n' +
    '┃\n' +
    '┃ 🟢 *Node.js:* ' + nodeVersion + '\n' +
    '╰───────────────━⊷'
  )
}
