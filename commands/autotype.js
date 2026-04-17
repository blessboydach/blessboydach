// ============================================================
//  VANGUARD MD — commands/autotype.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

const VALID = ['off', 'all', 'groups', 'dms']

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const scope = args[0]?.toLowerCase()

  if (!scope || !VALID.includes(scope)) {
    const cur = config.autoType ?? defaults.autoType ?? 'off'
    return reply(
      '⌨️ *AUTO TYPE*\n' +
      '📍 *Current:* ' + cur + '\n' +
      '*Usage:* .autotype <scope>\n' +
      '• off    — disabled\n' +
      '• all    — everywhere\n' +
      '• groups — groups only\n' +
      '• dms    — DMs only\n' +
      ''
    )
  }

  // ── Conflict: only one flex at a time ─────────────────────
  if (scope !== 'off') {
    config.autoRecord     = 'off'
    config.autoRecordType = 'off'
  }

  config.autoType = scope

  await reply(
    '⌨️ *AUTO TYPE*\n' +
    (scope === 'off'
      ? '❌ *OFF* — Typing indicator disabled\n'
      : '✅ *' + scope.toUpperCase() + '* — Typing in ' + scope + '\n' +
        '_Auto Record + RecordType disabled_\n') +
    ''
  )
}
