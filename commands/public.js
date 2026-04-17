// ============================================================
//  VANGUARD MD — commands/public.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  config.mode = 'public'

  await reply(
    ' ✅ Bot will now respond to *everyone*\n' +
    ''
  )
}
