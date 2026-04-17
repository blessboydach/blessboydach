// ============================================================
//  VANGUARD MD — commands/alwaysonline.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌This command is restricted to Owner/sudo only!')

  const state = args[0]?.toLowerCase()

  if (!state || !['on', 'off'].includes(state)) {
    const cur = config.alwaysOnline ?? defaults.alwaysOnline ?? false
    return reply(
      '🟢 *ALWAYS ONLINE*\n' +
      '📍 *Current:* ' + (cur ? 'ON ✅' : 'OFF ❌') + '\n' +
      '*Usage:* .alwaysonline on/off\n' +
      '_ON  = always shows online_\n' +
      '_OFF = real last seen restored_\n' +
      ''
    )
  }

  config.alwaysOnline = state === 'on'

  await reply(
    '🟢 *ALWAYS ONLINE*\n' +
    (config.alwaysOnline
      ? '✅ *ON* — Always showing online\n'
      : '❌ *OFF* — Real last seen restored\n' +
        '_Restart to fully apply last seen_\n') +
    ''
  )
}
