// ============================================================
//  VANGUARD MD — commands/antideletestatus.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()
  if (!state || !['on', 'off'].includes(state)) {
    return reply(
      '📸 *ANTI DELETE STATUS*\n' +
      '❌ Usage: *.antideletestatus on/off*\n' +
      '📍 *Current:* ' + (config.antideleteStatus ? 'ON' : 'OFF') + '\n' +
      ''
    )
  }

  config.antideleteStatus = state === 'on'

  await reply(
    '📸 *ANTI DELETE STATUS*\n' +
    (config.antideleteStatus
      ? '✅ *ON* — Deleted statuses forwarded to owner inbox\n'
      : '❌ *OFF* — Deleted statuses will be ignored\n') +
    ''
  )
}
