// ============================================================
//  VANGUARD MD — commands/gset.js
// ============================================================

const { getGroupSettings, isBotAdmin } = require('../lib/utils')

const tog = (val) => val ? '✅ ON' : '❌ OFF'

module.exports = async (ctx) => {
  const { sock, reply, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command must be used inside a group!')

  let subject = jid
  try {
    const meta = await sock.groupMetadata(jid)
    subject = meta.subject || subject
  } catch (_) {}

  let adminStatus = '❌'
  try {
    adminStatus = (await isBotAdmin(sock, jid)) ? '✅ Admin' : '❌ Not Admin'
  } catch (_) {}

  const s = getGroupSettings(jid) || {}

  const rows = [
    `• Anti Link:          ${tog(s.antilink)}${s.antilinkAction ? ' — ' + s.antilinkAction.toUpperCase() : ''}`,
    `• Anti Media:         ${tog(s.antimedia)}${s.antimediaAction ? ' — ' + s.antimediaAction.toUpperCase() : ''}`,
    `• Anti Sticker:       ${tog(s.antisticker)}${s.antistickerAction ? ' — ' + s.antistickerAction.toUpperCase() : ''}`,
    `• Anti Badword:       ${tog(s.antibadword)}${s.antibadwordAction ? ' — ' + s.antibadwordAction.toUpperCase() : ''}`,
    `• Anti Group Mention: ${tog(s.antigroupmention)}${s.antigroupmentionAction ? ' — ' + s.antigroupmentionAction.toUpperCase() : ''}`,
    `• Welcome:            ${tog(s.welcome)}${s.welcomeMsg ? ' — custom ✅' : ''}`,
    `• Goodbye:            ${tog(s.goodbye)}${s.goodbyeMsg ? ' — custom ✅' : ''}`,
  ]

  await reply(
    '🏷️ *GROUP SETTINGS*\n' +
    '📛 *Name:* '        + subject + '\n' +
    '🛡️ *Bot Admin:* '   + adminStatus + '\n' +
    '⚙️ *Settings:*\n' +
    '' + rows.join('\n') + '\n' +
    ''
  )
}
