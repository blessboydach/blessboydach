// ============================================================
//  VANGUARD MD — commands/autoviewstatus.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()
  if (!state || !['on', 'off'].includes(state)) {
    return reply(
      '👁️ *AUTO VIEW STATUS*\n' +
      '❌ Usage: *.autoviewstatus on/off*\n' +
      '📍 *Current:* ' + (config.autoViewStatus ? 'ON' : 'OFF') + '\n' +
      ''
    )
  }

  config.autoViewStatus = state === 'on'

  await reply(
    '👁️ *AUTO VIEW STATUS*\n' +
    (config.autoViewStatus
      ? '✅ *ON* — Bot will automatically view all statuses\n'
      : '❌ *OFF* — Statuses will not be auto-viewed\n') +
    ''
  )
}
