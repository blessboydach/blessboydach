// ============================================================
//  VANGUARD MD — commands/chatbot.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()
  if (!state || !['on', 'off'].includes(state)) {
    return reply(
      '🤖 *CHATBOT*\n' +
      '❌ Usage: *.chatbot on/off*\n' +
      '📍 *Current:* ' + (config.chatbot ? 'ON' : 'OFF') + '\n' +
      ''
    )
  }

  config.chatbot = state === 'on'

  await reply(
    '🤖 *CHATBOT*\n' +
    (config.chatbot
      ? '✅ *ON* — Bot will reply to normal messages using local AI replies\n'
      : '❌ *OFF* — Bot will only respond to commands\n') +
    ''
  )
}
