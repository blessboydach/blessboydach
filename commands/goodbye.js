// ============================================================
//  VANGUARD MD — commands/goodbye.js
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
      '👋 *GOODBYE*\n' +
      '📍 *Status:* ' + (s.goodbye ? 'ON ✅' : 'OFF ❌') + '\n' +
      '*Usage:*\n' +
      '.goodbye on\n' +
      '.goodbye off\n' +
      '.goodbye set Your message\n' +
      '.goodbye reset\n' +
      '*Variables:*\n' +
      '{user} — mention member\n' +
      '{group} — group name\n' +
      '{desc} — group description\n' +
      '{count} — remaining members\n' +
      ''
    )
  }

  if (sub === 'on') {
    saveGroupSettings(jid, { goodbye: true })
    return reply('✅ _Goodbye messages enabled!_')
  }

  if (sub === 'off') {
    saveGroupSettings(jid, { goodbye: false })
    return reply('❌ _Goodbye messages disabled!_')
  }

  if (sub === 'reset') {
    saveGroupSettings(jid, { goodbyeMsg: null })
    return reply('✅ _Goodbye message reset to default!_')
  }

  if (sub === 'set') {
    const msg = args.slice(1).join(' ').trim()
    if (!msg) return reply('❌ _Provide a message! Example: .goodbye set Goodbye {user}!_')
    saveGroupSettings(jid, { goodbye: true, goodbyeMsg: msg })
    return reply('✅ _Goodbye message set!_\n_' + msg + '_')
  }

  return reply('❌ _Usage: .goodbye on/off/set/reset_')
}
