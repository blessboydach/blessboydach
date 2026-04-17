// ============================================================
//  VANGUARD MD — commands/antidelete.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')
const fs       = require('fs')
const path     = require('path')

const MEDIA_DIR = path.join(__dirname, '..', 'src', 'session_media')

const clearMediaDir = () => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) return 0
    const files = fs.readdirSync(MEDIA_DIR)
    let count = 0
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(MEDIA_DIR, file))
        count++
      } catch (_) {}
    }
    return count
  } catch { return 0 }
}

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()
  if (!state || !['on', 'off'].includes(state)) {
    return reply(
      '🗑️ *ANTI DELETE*\n' +
      '❌ Usage: *.antidelete on/off*\n' +
      '📍 *Current:* ' + (config.antidelete ? 'ON ✅' : 'OFF ❌') + '\n' +
      ''
    )
  }

  config.antidelete = state === 'on'

  // ── Auto clear media when turned OFF ─────────────────────
  let cleared = 0
  if (!config.antidelete) {
    cleared = clearMediaDir()
  }

  await reply(
    '🗑️ *ANTI DELETE*\n' +
    (config.antidelete
      ? '✅ *ON* — Deleted messages forwarded to owner\n' +
        '💾 _Media will be saved for recovery_\n'
      : '❌ *OFF* — Deleted messages ignored\n' +
        '🧹 _Cleared ' + cleared + ' media files from disk_\n') +
    ''
  )
}
