// ============================================================
//  VANGUARD MD — commands/restart.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  await reply(


    ' 🔄 VANGUARD MD is restarting...\n' +
    ' ⏳ Please wait a few seconds.\n' +
    ''
  )

  setTimeout(() => process.exit(1), 5000)
}
