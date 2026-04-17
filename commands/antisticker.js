// ============================================================
//  VANGUARD MD — commands/antisticker.js
//  No Empty Bubbles Edition 🗿
// ============================================================

const { saveGroupSettings, getGroupSettings, isBotAdmin, isSenderAdmin, addWarn, resetWarns, jidToNum } = require('../lib/utils')

// Safe logger fallback
let logger
try {
  logger = require('../lib/logger')
} catch (e) {
  logger = {
    info: (...args) => console.log('[ℹ️]', ...args),
    error: (...args) => console.error('[❌]', ...args)
  }
}

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo, sock } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  // STEP 1: Check bot admin status FIRST (don't waste time)
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
      '❌ Usage: *.antisticker <action> on/off*\n' +
      '*Actions:*\n' +
      '• warn   — Warn (3 = kick)\n' +
      '• delete — Silent delete only\n' +
      '• remove — Delete + instant kick\n' +
      '📍 *Current:* ' + (settings.antisticker ? 'ON ✅' : 'OFF ❌') + '\n' +
      '⚙️ *Action:* ' + (settings.antistickerAction || 'warn') + '\n' +
      '_Example: .antisticker warn on_\n' +
      ''
    )
  }

  saveGroupSettings(jid, {
    antisticker:       state === 'on',
    antistickerAction: action,
  })

  await reply(
    (state === 'on'
      ? '✅ *ON* — Action: *' + action.toUpperCase() + '*\n' +
        '_Stickers from non-admins will be ' +
        (action === 'warn'   ? 'warned (3 = kick)' :
         action === 'delete' ? 'silently deleted' :
                               'deleted and sender kicked') + '_\n'
      : '❌ *OFF* — Stickers are now allowed\n') +
    ''
  )
}

// ── ENFORCER (Fixed Order - No Empty Bubbles) ─────────────────
module.exports.enforce = async (sock, msg, jid, sender) => {
  try {
    // STEP 1: Get settings first
    const settings = getGroupSettings(jid)
    
    // STEP 2: If antisticker is OFF, return immediately
    if (!settings.antisticker) return

    // STEP 3: Check if it's actually a sticker
    const m = msg.message || {}
    const isSticker = (
      m.stickerMessage                         ||
      m.viewOnceMessage?.message?.stickerMessage ||
      m.viewOnceMessageV2?.message?.stickerMessage
    )
    
    if (!isSticker) return

    // STEP 4: Check if bot is admin (DON'T WASTE TIME IF NOT)
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return

    // STEP 5: Check if sender is admin (exempt admins)
    const senderAdmin = await isSenderAdmin(sock, jid, sender)
    if (senderAdmin) return

    // STEP 6: Get action mode (if invalid, return)
    const action = settings.antistickerAction || 'warn'
    if (!['warn', 'delete', 'remove'].includes(action)) return

    // STEP 7: Get sender number for mentions
    const senderNum = jidToNum(sender)

    // STEP 8: Wait 1 second before deleting (avoid WhatsApp bubble bug)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // STEP 9: Delete the target sticker
    try { 
      await sock.sendMessage(jid, { delete: msg.key }) 
    } catch (delErr) {
      // If delete fails, don't continue with punishment
      logger.error(`[ANTISTICKER] Delete failed: ${delErr.message}`)
      return
    }

    // STEP 10: Apply punishment based on mode
    if (action === 'delete') {
      // Silent mode — just delete, no message
      logger.info(`[ANTISTICKER] Silent delete: ${senderNum}`)
      return
    }

    if (action === 'warn') {
      const newCount = addWarn(jid, senderNum, 'antisticker')

      if (newCount >= 3) {
        // Reset and kick at 3 warnings
        resetWarns(jid, senderNum)
        try {
          await sock.groupParticipantsUpdate(jid, [sender], 'remove')
          await sock.sendMessage(jid, {
            text:
              '🚨 @' + senderNum + ' removed after *3 warnings!*\n' +
              'For Sending stickers\n' +
              '',
            mentions: [sender],
          })
        } catch (kickErr) {
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
            '🎭 _Stickers are not allowed in this group!_\n' +
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
            '🚫 @' + senderNum + ' removed for sending a sticker!\n' +
            '',
          mentions: [sender],
        })
      } catch (kickErr) {
        await sock.sendMessage(jid, {
          text:
            '⚠️ @' + senderNum + ' sent a sticker\n' +
            '❌ _Could not remove — please kick manually_\n' +
            '',
          mentions: [sender],
        })
      }
      return
    }

  } catch (err) {
    logger.error(`[ANTISTICKER] Error: ${err.message}`)
  }
}
