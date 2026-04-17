// ============================================================
//  VANGUARD MD — commands/private.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  config.mode = 'private'

  await reply(
    
    ' ✅ Bot will now respond to *owner/sudo only*\n' +
    ''
  )
}
