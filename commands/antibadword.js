// ============================================================
//  VANGUARD MD — commands/antibadword.js
// ============================================================

const { saveGroupSettings, getGroupSettings, isBotAdmin, isSenderAdmin, getWarnCount, setWarnCount, jidToNum, readData } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo, sock } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  // ── Bot must be admin to enable/modify ───────────────────
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply(
    '🤬 ANTI BAD WORD\n' +
    '❌ I need to be an admin first!\n' +
    'Make me an admin before enabling\n' +
    ''
  )

  const action = args[0]?.toLowerCase()
  const state  = args[1]?.toLowerCase()

  const validActions = ['warn', 'delete', 'remove']
  const validStates  = ['on', 'off']

  if (!action || !validActions.includes(action) || !state || !validStates.includes(state)) {
    const settings = getGroupSettings(jid)
    return reply(
      '🤬 *ANTI BAD WORD*\n' +
      '❌ Usage: *.antibadword <action> on/off*\n' +
      '📍 *Current:* ' + (settings.antibadword ? 'ON' : 'OFF') + '\n' +
      '⚙️ *Action:* ' + (settings.antibadwordAction || 'warn') + '\n' +
      '💡 Add words with *.addbadword <word>*\n' +
      '_Example: .antibadword warn on_\n' +
      ''
    )
  }

  saveGroupSettings(jid, {
    antibadword:       state === 'on',
    antibadwordAction: action,
  })

  await reply(
    '🤬 *ANTI BAD WORD*\n' +
    (state === 'on'
      ? '✅ *ON* — Action: *' + action.toUpperCase() + '*\n' +
        '_Bad words from non-admins will be ' +
        (action === 'warn'   ? 'deleted and warned' :
         action === 'delete' ? 'deleted silently'   :
                               'deleted and user removed') + '_\n'
      : '❌ *OFF* — Bad word filter disabled\n') +
    ''
  )
}

// ── Enforcer ──────────────────────────────────────────────────
module.exports.enforce = async (sock, msg, jid, sender) => {
  try {
    const settings = getGroupSettings(jid)
    if (!settings.antibadword) return

    const body = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption || ''
    ).toLowerCase()

    if (!body) return

    const defaultWords  = readData('badwords.json')
    const groupSettings = getGroupSettings(jid)
    const customWords   = groupSettings.customBadWords || []
    const allBadWords   = [...new Set([...defaultWords, ...customWords])]

    const found = allBadWords.find(word => body.includes(word.toLowerCase()))
    if (!found) return

    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return

    const senderAdmin = await isSenderAdmin(sock, jid, sender)
    if (senderAdmin) return

    const action    = settings.antibadwordAction || 'warn'
    const senderNum = jidToNum(sender)

    try { await sock.sendMessage(jid, { delete: msg.key }) } catch (_) {}

    if (action === 'warn') {
      const current  = getWarnCount(jid, senderNum)
      const newCount = current + 1
      setWarnCount(jid, senderNum, newCount)
      await sock.sendMessage(jid, {
        text:     '⚠️ @' + senderNum + ' watch your language!\n🔢 *Warning ' + newCount + '/3*',
        mentions: [sender],
      })
    } else if (action === 'delete') {
      await sock.sendMessage(jid, {
        text:     '🤬 @' + senderNum + ' that language is not allowed here!',
        mentions: [sender],
      })
    } else if (action === 'remove') {
      try {
        await sock.groupParticipantsUpdate(jid, [sender], 'remove')
        await sock.sendMessage(jid, {
          text:     '🚫 @' + senderNum + ' was removed for using bad language.',
          mentions: [sender],
        })
      } catch (_) {}
    }
  } catch (err) {
    require('../lib/logger').error('🤬 Antibadword enforce error: ' + err.message)
  }
}