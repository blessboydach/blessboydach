// ============================================================
//  VANGUARD MD — commands/groups.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  config.mode = 'groups'

  await reply(
    '👥 *GROUPS MODE*\n' +
    '✅ Bot will now respond to *groups only*\n' +
    '⚠️ DMs/inbox are now blocked\n' +
    ''
  )
}