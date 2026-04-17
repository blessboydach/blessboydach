// ============================================================
//  VANGUARD MD — commands/botstatus.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

const tog = (val) => val ? '✅ ON' : '❌ OFF'

const scopeDisplay = (val) => {
  if (!val || val === 'off' || val === false) return '❌ OFF'
  if (val === true || val === 'all')          return '✅ ALL'
  if (val === 'groups')                       return '👥 GROUPS'
  if (val === 'dms')                          return '💬 DMS'
  return String(val).toUpperCase()
}

const presenceMode = () => {
  const rt = config.autoRecordType ?? defaults.autoRecordType ?? 'off'
  const r  = config.autoRecord     ?? defaults.autoRecord     ?? 'off'
  const t  = config.autoType       ?? defaults.autoType       ?? 'off'
  if (rt && rt !== 'off' && rt !== false) return '🔀 RecordType — ' + scopeDisplay(rt)
  if (r  && r  !== 'off' && r  !== false) return '🎙️ Record — '     + scopeDisplay(r)
  if (t  && t  !== 'off' && t  !== false) return '⌨️ Type — '       + scopeDisplay(t)
  return '❌ OFF'
}

module.exports = async (ctx) => {
  const { reply } = ctx
  const prefix     = config.prefix     || defaults.prefix
  const botName    = config.botName    || defaults.botName
  const customs    = config.autoReactCustom ?? defaults.autoReactCustom ?? []
  const saveMode   = config.autoSaveStatus  ?? defaults.autoSaveStatus  ?? 'off'

  await reply(
    '⚙️ *BOT STATUS*\n' +
    '🤖 *Name:* '    + botName + '\n' +
    '📡 *Mode:* '    + (config.mode || defaults.mode).toUpperCase() + '\n' +
    '🔑 *Prefix:* '  + prefix + '\n' +
    '🌐 *Online:* '  + (config.alwaysOnline ?? defaults.alwaysOnline ? '✅ Always Online' : '⏱️ Real Last Seen') + '\n' +
    '📖 *Auto Read:*        ' + scopeDisplay(config.autoRead        ?? defaults.autoRead) + '\n' +
    '❤️ *Auto React:*       ' + scopeDisplay(config.autoReact       ?? defaults.autoReact) + '\n' +
    (customs.length ? '🎨 *React Custom:*     ' + customs.join(' ') + '\n' : '') +
    '🎭 *Presence Flex:*    ' + presenceMode() + '\n' +
    '👁️ *View Status:*      ' + tog(config.autoViewStatus   ?? defaults.autoViewStatus) + '\n' +
    '❤️ *React Status:*     ' + tog(config.autoReactStatus  ?? defaults.autoReactStatus) + '\n' +
    '💾 *Save Status:*      ' + (saveMode === 'off' ? '❌ OFF' : '✅ ' + saveMode.toUpperCase()) + '\n' +
    '🤖 *Chatbot:*          ' + tog(config.chatbot  ?? defaults.chatbot) + '\n' +
    '📵 *Anti Call:*        ' + tog(config.anticall ?? defaults.anticall) + '\n' +
    '🛡️ *Privacy*\n' +
    '• Anti Delete:         ' + tog(config.antidelete       ?? defaults.antidelete) + '\n' +
    '• Anti Delete Status:  ' + tog(config.antideleteStatus ?? defaults.antideleteStatus) + '\n' +
    '• Anti Edit:           ' + tog(config.antiedit         ?? defaults.antiedit) + '\n' +
    '😀 *Status Emojis:* ' + (config.statusEmojis || defaults.statusEmojis).join(' ') + '\n' +
    ''
  )
}
