// ============================================================
//  VANGUARD MD — commands/getsettings.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')
const { getGroupSettings, isBotAdmin } = require('../lib/utils')

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
  const { reply, sock, jid, fromGroup, isSudo } = ctx

  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const prefix      = config.prefix      || defaults.prefix
  const botName     = config.botName     || defaults.botName
  const ownerNumber = config.ownerNumber || defaults.ownerNumber || 'unknown'
  const customs     = config.autoReactCustom ?? defaults.autoReactCustom ?? []
  const saveMode    = config.autoSaveStatus  ?? defaults.autoSaveStatus  ?? 'off'

  let adminStatus = 'Not a group'
  if (fromGroup) {
    try {
      adminStatus = (await isBotAdmin(sock, jid)) ? '✅ Admin' : '❌ Not Admin'
    } catch (_) {
      adminStatus = '❌ Not Admin'
    }
  }

  let groupBlock = '_Use inside a group to see group settings_'
  if (fromGroup) {
    const s = getGroupSettings(jid) || {}
    const rows = [
      `• Anti Link:          ${tog(s.antilink)}${s.antilinkAction ? ' — ' + s.antilinkAction.toUpperCase() : ''}`,
      `• Anti Media:         ${tog(s.antimedia)}${s.antimediaAction ? ' — ' + s.antimediaAction.toUpperCase() : ''}`,
      `• Anti Sticker:       ${tog(s.antisticker)}${s.antistickerAction ? ' — ' + s.antistickerAction.toUpperCase() : ''}`,
      `• Anti Badword:       ${tog(s.antibadword)}${s.antibadwordAction ? ' — ' + s.antibadwordAction.toUpperCase() : ''}`,
      `• Anti Group Mention: ${tog(s.antigroupmention)}${s.antigroupmentionAction ? ' — ' + s.antigroupmentionAction.toUpperCase() : ''}`,
      `• Welcome:            ${tog(s.welcome)}`,
      `• Goodbye:            ${tog(s.goodbye)}`,
    ]
    groupBlock = rows.join('\n')
  }

  await reply(
    '⚙️ *GET SETTINGS*\n' +
    '🤖 *Bot:* '    + botName + '\n' +
    '🔑 *Prefix:* ' + prefix + '\n' +
    '👑 *Owner:* +' + ownerNumber + '\n' +
    '📡 *Mode:* '   + (config.mode || defaults.mode).toUpperCase() + '\n' +
    '🌐 *Online:* ' + (config.alwaysOnline ?? defaults.alwaysOnline ? '✅ Always Online' : '⏱️ Real Last Seen') + '\n' +
    '📖 *Auto Read:*       ' + scopeDisplay(config.autoRead        ?? defaults.autoRead) + '\n' +
    '❤️ *Auto React:*      ' + scopeDisplay(config.autoReact       ?? defaults.autoReact) + '\n' +
    (customs.length ? '🎨 *React Custom:*    ' + customs.join(' ') + '\n' : '') +
    '🎭 *Presence Flex:*   ' + presenceMode() + '\n' +
    '👁️ *View Status:*     ' + tog(config.autoViewStatus   ?? defaults.autoViewStatus) + '\n' +
    '❤️ *React Status:*    ' + tog(config.autoReactStatus  ?? defaults.autoReactStatus) + '\n' +
    '💾 *Save Status:*     ' + (saveMode === 'off' ? '❌ OFF' : '✅ ' + saveMode.toUpperCase()) + '\n' +
    '🤖 *Chatbot:*         ' + tog(config.chatbot  ?? defaults.chatbot) + '\n' +
    '📵 *Anti Call:*       ' + tog(config.anticall ?? defaults.anticall) + '\n' +
    '🛡️ *Privacy*\n' +
    '• Anti Delete:        ' + tog(config.antidelete       ?? defaults.antidelete) + '\n' +
    '• Anti Delete Status: ' + tog(config.antideleteStatus ?? defaults.antideleteStatus) + '\n' +
    '• Anti Edit:          ' + tog(config.antiedit         ?? defaults.antiedit) + '\n' +
    '🛡️ *Bot Admin (this chat):* ' + adminStatus + '\n' +
    '🏘️ *Group Settings:*\n' +
    '' + groupBlock.replace(/\n/g, '\n') + '\n' +
    ''
  )
}
