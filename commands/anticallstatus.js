// ============================================================
//  VANGUARD MD — commands/anticallstatus.js
//  Display full anti-call configuration
//  Restricted: Owner & Sudo only
// ============================================================

const { getStatus, getMessage } = require('../lib/anticallhelper')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx

  // Permission check
  if (!isSudo) {
    return reply(
      '❌ *ACCESS DENIED*\n' +
      '🔒 Owner/Sudo only command.\n' +
      ''
    )
  }

  const status = getStatus()
  const currentMsg = getMessage()

  return reply(
    '📊 *ANTI-CALL STATUS*\n' +
    `🔘 *Enabled:* ${status.enabled ? '✅ Yes' : '❌ No'}\n` +
    `🎚️ *Mode:* ${status.mode.toUpperCase()}\n` +
    `🔔 *Notify Owner:* ${status.notifyOwner ? '✅ Yes' : '❌ No'}\n` +
    `📝 *Custom Message:* ${status.useCustomMessage ? '✅ Yes' : '❌ No'}\n` +
    '💬 *Current Message:*\n' +
    `_${currentMsg}_\n` +
    '🛠️ *COMMANDS:*\n' +
    '• .anticallmode — Switch modes\n' +
    '• .anticallmsg — Set message\n' +
    '• .anticallreset — Reset defaults\n' +
    '• .anticalltest — Test message\n' +
    ''
  )
}
