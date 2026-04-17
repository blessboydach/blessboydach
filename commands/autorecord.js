// ============================================================
//  VANGUARD MD — commands/autorecord.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

const VALID = ['off', 'all', 'groups', 'dms']

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const scope = args[0]?.toLowerCase()

  if (!scope || !VALID.includes(scope)) {
    const cur = config.autoRecord ?? defaults.autoRecord ?? 'off'
    return reply(
      '🎙️ *AUTO RECORD*\n' +
      '📍 *Current:* ' + cur + '\n' +
      '*Usage:* .autorecord <scope>\n' +
      '• off    — disabled\n' +
      '• all    — everywhere\n' +
      '• groups — groups only\n' +
      '• dms    — DMs only\n' +
      ''
    )
  }

  // ── Conflict: only one flex at a time ─────────────────────
  if (scope !== 'off') {
    config.autoType       = 'off'
    config.autoRecordType = 'off'
  }

  config.autoRecord = scope

  await reply(
    '🎙️ *AUTO RECORD*\n' +
    (scope === 'off'
      ? '❌ *OFF* — Recording indicator disabled\n'
      : '✅ *' + scope.toUpperCase() + '* — Recording in ' + scope + '\n' +
        '_Auto Type + RecordType disabled_\n') +
    ''
  )
}
