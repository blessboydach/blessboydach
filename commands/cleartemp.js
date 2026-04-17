// ============================================================
//  VANGUARD MD — commands/cleartemp.js
// ============================================================

const fs      = require('fs')
const path    = require('path')

const SRC_DIR     = path.join(__dirname, '..', 'src')
const SESSION_DIR = path.join(__dirname, '..', 'session')

const clearDir = (dir, keepFile = null) => {
  try {
    if (!fs.existsSync(dir)) return 0
    const files = fs.readdirSync(dir)
    let count = 0
    for (const file of files) {
      if (keepFile && file === keepFile) continue
      try {
        const filePath = path.join(dir, file)
        const stat     = fs.statSync(filePath)
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(filePath)
        }
        count++
      } catch (_) {}
    }
    return count
  } catch { return 0 }
}

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  await reply('⏳ *Clearing temp files...*')

  // ── Clear src subfolders ──────────────────────────────────
  const mediaDel   = clearDir(path.join(SRC_DIR, 'session_media'))
  const msgsDel    = clearDir(path.join(SRC_DIR, 'session_msgs'))
  const statusDel  = clearDir(path.join(SRC_DIR, 'session_statuses'))
  const voDel      = clearDir(path.join(SRC_DIR, 'session_vo'))

  // ── Clear session — keep creds.json ──────────────────────
  const sessionDel = clearDir(SESSION_DIR, 'creds.json')

  const total = mediaDel + msgsDel + statusDel + voDel + sessionDel

  await reply(
    '🧹 *CLEAR TEMP*\n' +
    '✅ *Cleanup Complete!*\n' +
    '💾 *Media files:* '      + mediaDel   + ' deleted\n' +
    '💬 *Message cache:* '    + msgsDel    + ' deleted\n' +
    '📸 *Status cache:* '     + statusDel  + ' deleted\n' +
    '👁️ *View-once cache:* '  + voDel      + ' deleted\n' +
    '🔑 *Session files:* '    + sessionDel + ' deleted\n' +
    '─────────────────────\n' +
    '🗑️ *Total:* '            + total      + ' files\n' +
    '_creds.json preserved ✅_\n' +
    ''
  )
}
