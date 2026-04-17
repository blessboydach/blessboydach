// ============================================================
//  VANGUARD MD — commands/inbox.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  config.mode = 'inbox'

  await reply(
    '📥 *INBOX MODE*\n' +
    '✅ Bot will now respond to *DMs/inbox only*\n' +
    '⚠️ Groups are now blocked\n' +
    ''
  )
}