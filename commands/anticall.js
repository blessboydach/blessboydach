// ============================================================
//  VANGUARD MD — commands/anticall.js
//  Main anti-call router — delegates to specific commands
//  Maintains backward compatibility
//  Restricted: Owner & Sudo only
// ============================================================

const { getStatus, VALID_MODES } = require('../lib/anticallhelper')

// Import sub-commands
const modeCommand = require('./anticallmode')
const msgCommand = require('./anticallmsg')
const resetCommand = require('./anticallreset')
const statusCommand = require('./anticallstatus')
const testCommand = require('./anticalltest')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx

  // Permission check
  if (!isSudo) {
    return reply(
      '❌ *ACCESS DENIED*\n' +
      '🔒 Only *owner* or *sudo* users can\n' +
      '   configure anti-call settings.\n' +
      ''
    )
  }

  const subCommand = args[0]?.toLowerCase()

  // ── No args / main help ────────────────────────────────────
  if (!subCommand) {
    const status = getStatus()
    return reply(
      '📵 *ANTI-CALL SYSTEM*\n' +
      `📍 *Current Mode:* ${status.mode.toUpperCase()}\n` +
      `🔔 *Status:* ${status.enabled ? '✅ ON' : '❌ OFF'}\n` +
      `📝 *Custom Msg:* ${status.useCustomMessage ? '✅ Yes' : '❌ No'}\n` +
      '🛠️ *QUICK COMMANDS:*\n' +
      '*.anticall msg* — Decline + message\n' +
      '*.anticall decline* — Decline only\n' +
      '*.anticall block* — Decline + block\n' +
      '*.anticall off* — Disable\n' +
      '🛠️ *ADVANCED COMMANDS:*\n' +
      '• .anticallmode — Switch modes\n' +
      '• .anticallmsg — Set custom msg\n' +
      '• .anticallreset — Reset defaults\n' +
      '• .anticallstatus — Full status\n' +
      '• .anticalltest — Test message\n' +
      '> *Variables:* {caller}, {me}, {calltype}, {time}'
    )
  }

  // ── Route to specific commands ─────────────────────────────
  
  // Mode switching (backward compatible)
  if (VALID_MODES.includes(subCommand)) {
    return modeCommand(ctx)
  }

  // Message commands
  if (subCommand === 'msgset' || subCommand === 'setmsg' || subCommand === 'msg') {
    ctx.args = args.slice(1)
    return msgCommand(ctx)
  }

  // Reset commands
  if (subCommand === 'reset' || subCommand === 'msgreset') {
    ctx.args = args.slice(1)
    return resetCommand(ctx)
  }

  // Status command
  if (subCommand === 'status') {
    return statusCommand(ctx)
  }

  // Test command
  if (subCommand === 'test') {
    ctx.args = args.slice(1)
    return testCommand(ctx)
  }

  // ── Unknown command ────────────────────────────────────────
  return reply(
    '❌ *UNKNOWN COMMAND*\n' +
    'Use *.anticall* for help.\n' +
    ''
  )
}
