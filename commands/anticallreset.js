// ============================================================
//  VANGUARD MD — commands/anticallreset.js
//  Reset anti-call settings to defaults
//  Restricted: Owner & Sudo only
// ============================================================

const { resetMessage, setMode, DEFAULT_CONFIG } = require('../lib/anticallhelper')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx

  // Permission check
  if (!isSudo) {
    return reply(
      '❌ *ACCESS DENIED*\n' +
      '🔒 Owner/Sudo only command.\n' +
      ''
    )
  }

  const scope = args[0]?.toLowerCase()

  // No args = reset everything
  if (!scope) {
    const msgReset = resetMessage()
    const modeReset = setMode('msg')

    if (msgReset && modeReset) {
      return reply(
        '🔄 *FULL RESET*\n' +
        '✅ Mode: MSG\n' +
        '✅ Message: Default\n' +
        '✅ Custom: Disabled\n' +
        ''
      )
    } else {
      return reply(
        '❌ *RESET FAILED*\n' +
        'Some settings could not be reset.\n' +
        ''
      )
    }
  }

  // Reset specific component
  if (scope === 'msg' || scope === 'message') {
    const success = resetMessage()
    return reply(
      success
        ? '\n✅ *MESSAGE RESET*\n\nRestored to default.\n'
        : '\n❌ *FAILED*\n\nCould not reset.\n'
    )
  }

  if (scope === 'mode') {
    const success = setMode('msg')
    return reply(
      success
        ? '\n✅ *MODE RESET*\n\nMode set to MSG.\n'
        : '\n❌ *FAILED*\n\nCould not reset mode.\n'
    )
  }

  return reply(
    '❌ *UNKNOWN OPTION*\n' +
    'Usage: .anticallreset [msg|mode]\n' +
    '(no args = reset everything)\n' +
    ''
  )
}
