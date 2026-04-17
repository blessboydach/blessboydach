// ============================================================
//  VANGUARD MD — commands/antimedia.js (Fixed - No Empty Bubbles)
// ============================================================

const { saveGroupSettings, getGroupSettings, isBotAdmin, isSenderAdmin, addWarn, resetWarns, jidToNum } = require('../lib/utils')

const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo, sock } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  // STEP 1: Check if bot is admin FIRST (don't waste time if not)
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply(
    '❌ *I need to be an admin first!*\n' +
    '_Make me an admin before enabling_\n' +
    ''
  )

  const action = args[0]?.toLowerCase()
  const state  = args[1]?.toLowerCase()

  const validActions = ['warn', 'delete', 'remove']
  const validStates  = ['on', 'off']

  if (!action || !validActions.includes(action) || !state || !validStates.includes(state)) {
    const settings = getGroupSettings(jid)
    return reply(
      '❌ Usage: *.antimedia <action> on/off*\n' +
      '*Actions:*\n' +
      '• warn   — Warn (3 = kick)\n' +
      '• delete — Silent delete only\n' +
      '• remove — Delete + instant kick\n' +
      '📍 *Current:* ' + (settings.antimedia ? 'ON ✅' : 'OFF ❌') + '\n' +
      '⚙️ *Action:* ' + (settings.antimediaAction || 'warn') + '\n' +
      'ℹ️ _View-once messages are exempt_\n' +
      '_Example: .antimedia delete on_\n' +
      ''
    )
  }

  saveGroupSettings(jid, {
    antimedia:       state === 'on',
    antimediaAction: action,
  })

  await reply(
    (state === 'on'
      ? '✅ *ON* — Action: *' + action.toUpperCase() + '*\n' +
        '_Media from non-admins will be ' +
        (action === 'warn'   ? 'warned (3 = kick)' :
         action === 'delete' ? ' deleted' :
                               'deleted and sender kicked') + '_\n' +
        '_View-once is exempt_\n'
      : '❌ *OFF* — Media is now allowed\n') +
    ''
  )
}

// ── ENFORCER (Fixed Order - No Empty Bubbles) ─────────────────
module.exports.enforce = async (sock, msg, jid, sender) => {
  try {
    // STEP 1: Get settings first
    const settings = getGroupSettings(jid)
    
    // STEP 2: If antimedia is OFF, return immediately
    if (!settings.antimedia) return

    // STEP 3: Check if it's actually media
    const msgType = Object.keys(msg.message || {})[0]
    
    // View-once exempt
    if (
      msgType === 'viewOnceMessage'          ||
      msgType === 'viewOnceMessageV2'        ||
      msgType === 'viewOnceMessageV2Extension'
    ) return

    // Check if it's media we care about
    const actualType = msg.message?.[msgType]?.message ? 
      Object.keys(msg.message[msgType].message)[0] : msgType
    
    if (!MEDIA_TYPES.includes(actualType) && !MEDIA_TYPES.includes(msgType)) return

    // STEP 4: Check if bot is admin (DON'T WASTE TIME IF NOT)
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return // Silently ignore if we can't do anything

    // STEP 5: Check if sender is admin (exempt admins)
    const senderAdmin = await isSenderAdmin(sock, jid, sender)
    if (senderAdmin) return

    // STEP 6: Get action mode (if invalid, return)
    const action = settings.antimediaAction || 'warn'
    if (!['warn', 'delete', 'remove'].includes(action)) return

    // STEP 7: Get sender number for mentions
    const senderNum = jidToNum(sender)

    // STEP 8: Wait 1 second before deleting (avoid WhatsApp bubble bug)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // STEP 9: Delete the target message
    try { 
      await sock.sendMessage(jid, { delete: msg.key }) 
    } catch (delErr) {
      // If delete fails, don't continue with punishment
      return
    }

    // STEP 10: Apply punishment based on mode
    if (action === 'delete') {
      // Silent mode - just delete, no message
      return
    }

    if (action === 'warn') {
      const newCount = addWarn(jid, senderNum, 'antimedia')

      if (newCount >= 3) {
        // Reset and kick
        resetWarns(jid, senderNum)
        
        try {
          await sock.groupParticipantsUpdate(jid, [sender], 'remove')
          await sock.sendMessage(jid, {
            text:
              '🚨 @' + senderNum + ' removed after *3 warnings!*\n' +
              'For Sending media\n' +
              '',
            mentions: [sender],
          })
        } catch (kickErr) {
          // Failed to kick, just warn
          await sock.sendMessage(jid, {
            text:
              '🚨 @' + senderNum + ' reached *3 warnings*\n' +
              '❌ _Could not remove — please kick manually_\n' +
              '',
            mentions: [sender],
          })
        }
      } else {
        // Just warn
        await sock.sendMessage(jid, {
          text:
            '⚠️ *Warning ' + newCount + '/3* — @' + senderNum + '\n' +
            '🖼️ _Media is not allowed in this group!_\n' +
            (newCount === 2 ? '🚨 _One more = removal!_\n' : '') +
            '',
          mentions: [sender],
        })
      }
      return
    }

    if (action === 'remove') {
      // Instant kick
      try {
        await sock.groupParticipantsUpdate(jid, [sender], 'remove')
        await sock.sendMessage(jid, {
          text:
            '🚫 @' + senderNum + ' removed for sending media!\n' +
            '',
          mentions: [sender],
        })
      } catch (kickErr) {
        await sock.sendMessage(jid, {
          text:
            '⚠️ @' + senderNum + ' sent media\n' +
            '❌ _Could not remove — please kick manually_\n' +
            '',
          mentions: [sender],
        })
      }
      return
    }

  } catch (err) {
    // Silent fail - don't crash the bot
    console.error('[ANTIMEDIA]', err.message)
  }
}
