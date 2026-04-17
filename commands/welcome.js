// ============================================================
//  VANGUARD MD — commands/welcome.js
// ============================================================

const { saveGroupSettings, getGroupSettings } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ Groups only!')
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const sub = args[0]?.toLowerCase()

  if (!sub) {
    const s = getGroupSettings(jid)
    return reply(
      '╭───────────────━⊷\n' +
      '┃ 👋 *WELCOME*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 📍 *Status:* ' + (s.welcome ? 'ON ✅' : 'OFF ❌') + '\n' +
      '┃\n' +
      '┃ *Usage:*\n' +
      '┃ .welcome on\n' +
      '┃ .welcome off\n' +
      '┃ .welcome set Your message\n' +
      '┃ .welcome reset\n' +
      '┃\n' +
      '┃ *Variables:*\n' +
      '┃ {user} — mention member\n' +
      '┃ {group} — group name\n' +
      '┃ {desc} — group description\n' +
      '┃ {count} — member count\n' +
      '╰───────────────━⊷'
    )
  }

  if (sub === 'on') {
    saveGroupSettings(jid, { welcome: true })
    return reply('✅ _Welcome messages enabled!_')
  }

  if (sub === 'off') {
    saveGroupSettings(jid, { welcome: false })
    return reply('❌ _Welcome messages disabled!_')
  }

  if (sub === 'reset') {
    saveGroupSettings(jid, { welcomeMsg: null })
    return reply('✅ _Welcome message reset to default!_')
  }

  if (sub === 'set') {
    const msg = args.slice(1).join(' ').trim()
    if (!msg) return reply('❌ _Provide a message! Example: .welcome set Welcome {user}!_')
    saveGroupSettings(jid, { welcome: true, welcomeMsg: msg })
    return reply('✅ _Welcome message set!_\n_' + msg + '_')
  }

  return reply('❌ _Usage: .welcome on/off/set/reset_')
}
