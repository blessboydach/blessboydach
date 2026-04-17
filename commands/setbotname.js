// ============================================================
//  VANGUARD MD — commands/setbotname.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const name = args.join(' ').trim()
  if (!name)            return reply('❌ Provide a new bot name!\n_Example: .setbotname VANGUARD MD_')
  if (name.length > 30) return reply('❌ Name too long! Maximum 30 characters.')

  const oldName  = config.botName
  config.botName = name

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🤖 *BOT NAME UPDATED*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📝 *Old:* ' + oldName + '\n' +
    '┃ ✅ *New:* ' + name + '\n' +
    '╰───────────────━⊷'
  )
}
