// ============================================================
//  VANGUARD MD — commands/groupreset.js
//  Reset all group security settings in one command
// ============================================================

const { saveGroupSettings, getGroupSettings } = require('../lib/utils')
const fs   = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, isSudo, sock } = ctx

  if (!fromGroup) return reply('❌ Groups only!')
  if (!isSudo)    return reply('❌ Owner/sudo only!')

  const settings = getGroupSettings(jid)

  // ── Build report of what was ON before reset ──────────────
  const wasOn = []
  if (settings.antilink)          wasOn.push('🔗 Anti Link')
  if (settings.antimedia)         wasOn.push('🖼️ Anti Media')
  if (settings.antisticker)       wasOn.push('🎭 Anti Sticker')
  if (settings.antibadword)       wasOn.push('🤬 Anti Badword')
  if (settings.antigroupmention)  wasOn.push('📢 Anti Group Mention')
  if (settings.welcome)           wasOn.push('👋 Welcome')
  if (settings.goodbye)           wasOn.push('👋 Goodbye')

  // ── Reset all security settings ───────────────────────────
  saveGroupSettings(jid, {
    antilink:              false,
    antilinkAction:        'warn',
    antimedia:             false,
    antimediaAction:       'warn',
    antisticker:           false,
    antistickerAction:     'warn',
    antibadword:           false,
    antibadwordAction:     'warn',
    antigroupmention:      false,
    antigroupmentionAction:'warn',
    welcome:               false,
    welcomeMsg:            null,
    goodbye:               false,
    goodbyeMsg:            null,
  })

  // ── Also wipe warns.json for this group ───────────────────
  try {
    const warnsFile = path.join(__dirname, '..', 'groupstore', jid, 'warns.json')
    if (fs.existsSync(warnsFile)) fs.unlinkSync(warnsFile)
  } catch (_) {}

  if (!wasOn.length) {
    return reply(
      '🔄 *GROUP RESET*\n' +
      'ℹ️ _Nothing was ON — already clean!_\n' +
      ''
    )
  }

  await reply(
    '🔄 *GROUP RESET*\n' +
    '✅ *All settings reset!*\n' +
    '🗑️ *Warns cleared!*\n' +
    '*Was ON:*\n' +
    wasOn.map(s => '• ' + s).join('\n') + '\n' +
    ''
  )
}
