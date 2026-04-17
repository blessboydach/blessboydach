// ============================================================
//  VANGUARD MD — commands/mode.js
//  Universal Mode Switcher (Public/Private/Groups/Inbox)
// ============================================================

const config = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, isSudo, args, prefix, command } = ctx

  // Authorization Check
  if (!isSudo) return reply('❌ *Access Denied:* Only Sudo/Owner can change bot modes.')

  const targetMode = args[0]?.toLowerCase()

  if (!targetMode || !['public', 'private', 'groups', 'inbox'].includes(targetMode)) {
    return reply(
      '⚙️ *MODE SWITCH*\n' +
      '📥 *' + prefix + command + ' inbox*\n' +
      '👥 *' + prefix + command + ' groups*\n' +
      '🔓 *' + prefix + command + ' public*\n' +
      '🔒 *' + prefix + command + ' private*\n' +
      '> Current Mode: *' + (config.mode || defaults.mode || 'public') + '*'
    )
  }

  // ⚙️ Apply the Mode switch
  config.mode = targetMode

  // 🎨 Visual Feedback
  let icon = '⚙️'
  let description = ''

  switch (targetMode) {
    case 'public':
      icon = '🔓'
      description = 'Bot is now *Global*. Everyone can use commands.'
      break
    case 'private':
      icon = '🔒'
      description = 'Bot is now *Personal*. Only Sudo/Owner can use commands.'
      break
    case 'groups':
      icon = '👥'
      description = 'Bot will now respond to *Groups only*.'
      break
    case 'inbox':
      icon = '📥'
      description = 'Bot will now respond to *DMs/Inbox only*.'
      break
  }

  await reply(
    '' + icon + ' *MODE UPDATED*\n' +
    '🏷️ *New Status:* ' + targetMode.toUpperCase() + '\n' +
    '✨ ' + description + '\n' +
    '> *_VANGUARD MD is on fire 🔥_*'
  )
}
