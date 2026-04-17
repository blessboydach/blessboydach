// ============================================================
//  VANGUARD MD — commands/anticalltest.js
//  Test anti-call message with sample data
//  Restricted: Owner & Sudo only
// ============================================================

const { getMessage, formatMessage } = require('../lib/anticallhelper')

module.exports = async (ctx) => {
  const { reply, isSudo, sock, sender } = ctx

  // Permission check
  if (!isSudo) {
    return reply(
      '❌ *ACCESS DENIED*\n' +
      '🔒 Owner/Sudo only command.\n' +
      ''
    )
  }

  const testType = ctx.args[0]?.toLowerCase() || 'voice'
  
  if (!['voice', 'video'].includes(testType)) {
    return reply(
      '❌ *INVALID TYPE*\n' +
      'Use: voice or video\n' +
      'Example: .anticalltest video\n' +
      ''
    )
  }

  const rawTemplate = getMessage()
  const meName = sock.user?.name || 'VANGUARD MD'
  
  // Format with test data
  const formatted = formatMessage(rawTemplate, {
    caller: sender.split('@')[0],
    me: meName,
    calltype: testType,
    time: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: true })
  })

  return reply(
    '🧪 *ANTI-CALL TEST*\n' +
    `📞 *Test Type:* ${testType.toUpperCase()}\n` +
    `👤 *Simulated Caller:* @${sender.split('@')[0]}\n` +
    '💬 *Message Preview:*\n' +
    formatted + '\n' +
    ''
  )
}
