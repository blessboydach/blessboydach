// ============================================================
//  VANGUARD MD — commands/autoreactstatus.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()
  if (!state || !['on', 'off'].includes(state)) {
    const current = config.autoReactStatus ?? defaults.autoReactStatus
    const emojis  = (config.statusEmojis || defaults.statusEmojis).join(' ')
    return reply(
      '😀 *AUTO REACT STATUS*\n' +
      '❌ Usage: *.autoreactstatus on/off*\n' +
      '📍 *Current:* ' + (current ? 'ON' : 'OFF') + '\n' +
      '😀 *Emojis:* ' + emojis + '\n' +
      '💡 Change emojis with *.statusemoji*\n' +
      ''
    )
  }

  config.autoReactStatus = state === 'on'
  const emojis = (config.statusEmojis || defaults.statusEmojis).join(' ')

  await reply(
    '😀 *AUTO REACT STATUS*\n' +
    (config.autoReactStatus
      ? '✅ *ON* — Bot will react to statuses with: ' + emojis + '\n'
      : '❌ *OFF* — Bot will not react to statuses\n') +
    ''
  )
}
