// ============================================================
//  VANGUARD MD — commands/anticallmsg.js
//  Set custom anti-call rejection message
//  Variables: {caller}, {me}, {calltype}, {time}
//  Restricted: Owner & Sudo only
// ============================================================

const { setCustomMessage, getMessage } = require('../lib/anticallhelper')

module.exports = async (ctx) => {
  const { reply, args, isSudo, sock } = ctx

  // Permission check
  if (!isSudo) {
    return reply(
      '❌ *ACCESS DENIED*\n' +
      '🔒 Owner/Sudo only command.\n' +
      ''
    )
  }

  const customText = args.join(' ')

  if (!customText) {
    const currentMsg = getMessage()
    return reply(
      '📝 *ANTI-CALL MESSAGE*\n' +
      '*Current message:*\n' +
      `_${currentMsg}_\n` +
      '🛠️ *USAGE:*\n' +
      '.anticallmsg <your message>\n' +
      '*Variables:*\n' +
      '• {caller} — Callers number\n' +
      '• {me} — Bot name\n' +
      '• {calltype} — voice/video\n' +
      '• {time} — Current time\n' +
      '*Example:*\n' +
      '.anticallmsg Hey {caller}, {me} is busy!\n' +
      ''
    )
  }

  const success = setCustomMessage(customText)

  if (success) {
    // Generate preview with sample data
    const preview = customText
      .replace(/{caller}/gi, '2567XXXXXXX')
      .replace(/{me}/gi, sock.user?.name || 'VANGUARD MD')
      .replace(/{calltype}/gi, 'voice')
      .replace(/{time}/gi, new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }))

    return reply(
      '✅ *MESSAGE SET*\n' +
      '📝 *Preview:*\n' +
      `_${preview}_\n` +
      ''
    )
  } else {
    return reply(
      '❌ *FAILED*\n' +
      'Could not save message.\n' +
      ''
    )
  }
}
