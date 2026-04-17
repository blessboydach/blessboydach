// ============================================================
//  VANGUARD MD — commands/temprepo.js
// ============================================================

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const SRC_DIR     = path.join(__dirname, '..', 'src')
const SESSION_DIR = path.join(__dirname, '..', 'session')

// ── Get folder stats — count + size ──────────────────────────
const getFolderStats = (dir) => {
  try {
    if (!fs.existsSync(dir)) return { count: 0, size: 0 }
    const files = fs.readdirSync(dir)
    let count = 0
    let size  = 0
    for (const file of files) {
      try {
        const filePath = path.join(dir, file)
        const stat     = fs.statSync(filePath)
        if (stat.isFile()) {
          count++
          size += stat.size
        }
      } catch (_) {}
    }
    return { count, size }
  } catch { return { count: 0, size: 0 } }
}

// ── Format bytes → human readable ────────────────────────────
const formatSize = (bytes) => {
  if (bytes === 0)          return '0 B'
  if (bytes < 1024)         return bytes + ' B'
  if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// ── Progress bar ──────────────────────────────────────────────
const progressBar = (used, total, length = 10) => {
  const pct    = total > 0 ? Math.min(used / total, 1) : 0
  const filled = Math.round(pct * length)
  const empty  = length - filled
  const bar    = '█'.repeat(filled) + '░'.repeat(empty)
  return '[' + bar + '] ' + Math.round(pct * 100) + '%'
}

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  // ── Folder stats ──────────────────────────────────────────
  const media   = getFolderStats(path.join(SRC_DIR, 'session_media'))
  const msgs    = getFolderStats(path.join(SRC_DIR, 'session_msgs'))
  const status  = getFolderStats(path.join(SRC_DIR, 'session_statuses'))
  const vo      = getFolderStats(path.join(SRC_DIR, 'session_vo'))
  const session = getFolderStats(SESSION_DIR)

  const totalFiles = media.count + msgs.count + status.count + vo.count + session.count
  const totalSize  = media.size  + msgs.size  + status.size  + vo.size  + session.size

  // ── System RAM ────────────────────────────────────────────
  const totalRam = os.totalmem()
  const freeRam  = os.freemem()
  const usedRam  = totalRam - freeRam

  // ── Process memory ────────────────────────────────────────
  const procMem = process.memoryUsage()
  const rss     = procMem.rss
  const heap    = procMem.heapUsed

  // ── Disk usage via /proc/mounts or fallback ───────────────
  let diskUsed  = 0
  let diskTotal = 0
  try {
    const { execSync } = require('child_process')
    const df = execSync("df / --output=used,size -k | tail -1").toString().trim()
    const [u, t] = df.split(/\s+/).map(Number)
    diskUsed  = u * 1024
    diskTotal = t * 1024
  } catch (_) {}

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 📊 *TEMP REPO*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📁 *Temp Folders:*\n' +
    '┃\n' +
    '┃ 💾 *Media cache*\n' +
    '┃    ' + media.count   + ' files — ' + formatSize(media.size)   + '\n' +
    '┃\n' +
    '┃ 💬 *Message cache*\n' +
    '┃    ' + msgs.count    + ' files — ' + formatSize(msgs.size)    + '\n' +
    '┃\n' +
    '┃ 📸 *Status cache*\n' +
    '┃    ' + status.count  + ' files — ' + formatSize(status.size)  + '\n' +
    '┃\n' +
    '┃ 👁️ *View-once cache*\n' +
    '┃    ' + vo.count      + ' files — ' + formatSize(vo.size)      + '\n' +
    '┃\n' +
    '┃ 🔑 *Session files*\n' +
    '┃    ' + session.count + ' files — ' + formatSize(session.size) + '\n' +
    '┃\n' +
    '┃ 🗑️ *Total temp:* ' + totalFiles + ' files — ' + formatSize(totalSize) + '\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 🖥️ *System Resources:*\n' +
    '┃\n' +
    '┃ 🧠 *RAM Usage*\n' +
    '┃    ' + formatSize(usedRam) + ' / ' + formatSize(totalRam) + '\n' +
    '┃    ' + progressBar(usedRam, totalRam) + '\n' +
    '┃\n' +
    '┃ 🤖 *Bot RAM (RSS)*\n' +
    '┃    ' + formatSize(rss) + '\n' +
    '┃\n' +
    '┃ 🔋 *Bot Heap*\n' +
    '┃    ' + formatSize(heap) + '\n' +
    (diskTotal > 0
      ? '┃\n' +
        '┃ 💿 *Disk Usage*\n' +
        '┃    ' + formatSize(diskUsed) + ' / ' + formatSize(diskTotal) + '\n' +
        '┃    ' + progressBar(diskUsed, diskTotal) + '\n'
      : '') +
    '╰───────────────━⊷'
  )
}
