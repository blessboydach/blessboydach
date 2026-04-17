// ============================================================
//  VANGUARD MD — commands/antigroupmention.js
//  Zero Mercy 🗿 — No Empty Bubbles Edition
// ============================================================

const { getGroupSettings, saveGroupSettings, addWarn, resetWarns, jidToNum, isBotAdmin, isSenderAdmin } = require('../lib/utils')

// Safe logger fallback
let logger
try {
  logger = require('../lib/logger')
} catch (e) {
  logger = {
    info: (...args) => console.log('[ℹ️]', ...args),
    error: (...args) => console.error('[❌]', ...args),
    success: (...args) => console.log('[✅]', ...args)
  }
}

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  // STEP 1: Check bot admin status FIRST (don't waste time)
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply(
    '❌ *I need to be an admin first!*\n' +
    ''
  )

  const action = args[0]?.toLowerCase()
  const state  = args[1]?.toLowerCase()

  const validActions = ['warn', 'remove', 'delete']
  const validStates  = ['on', 'off']

  if (!action || !validActions.includes(action) || !state || !validStates.includes(state)) {
    const settings = getGroupSettings(jid)
    return reply(
      'Usage: *.antigroupmention <action> on/off*\n' +
      '*Actions:*\n' +
      '• warn   — Warn (3 = kick)\n' +
      '• remove — Kick immediately\n' +
      '• delete — Silent delete\n' +
      '📍 *Current:* ' + (settings.antigroupmention ? 'ON ✅' : 'OFF ❌') + '\n' +
      '⚙️ *Action:* ' + (settings.antigroupmentionAction || 'warn') + '\n' +
      ''
    )
  }

  saveGroupSettings(jid, {
    antigroupmention:       state === 'on',
    antigroupmentionAction: action,
  })

  await reply(
    '📢 *ANTI GROUP MENTION*\n' +
    (state === 'on'
      ? '✅ *ON* — Action: *' + action.toUpperCase() + '*\n'
      : '❌ *OFF*\n') +
    ''
  )
}

// ── Simple LID resolver ──────────────────────────────────────
const resolveSender = async (sock, rawSender, jid) => {
  if (!rawSender?.endsWith('@lid')) return rawSender
  try {
    const meta = await sock.groupMetadata(jid)
    const match = meta.participants.find(p => p.lid === rawSender)
    return match?.id || rawSender
  } catch {
    return rawSender
  }
}

// ── ENFORCER (Fixed Order - No Empty Bubbles) ───────────────
module.exports.enforceCard = async (sock, msg, jid) => {
  try {
    // STEP 1: Get settings first
    const settings = getGroupSettings(jid)
    
    // STEP 2: If antigroupmention is OFF, return immediately
    if (!settings.antigroupmention) return

    // STEP 3: Detect if it's actually a group mention
    const m = msg.message || {}
    let detected = false
    let sender = null

    // Detector 1: Modern group status mention (2025+)
    if (m.groupStatusMentionMessage) {
      detected = true
      sender = msg.key.participant || msg.participant || msg.key.remoteJid
    }
    
    // Detector 2: Legacy context mentions
    if (!detected) {
      const context = m.extendedTextMessage?.contextInfo || 
                     m.imageMessage?.contextInfo || 
                     m.videoMessage?.contextInfo
      if (context?.groupMentions?.some(g => g.groupJid === jid)) {
        detected = true
        sender = msg.key.participant || msg.participant || msg.key.remoteJid
      }
    }

    // Not a group mention? Return immediately
    if (!detected || !sender) return

    // STEP 4: Check if bot is admin (DON'T WASTE TIME IF NOT)
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return

    // STEP 5: Resolve sender and check if admin (exempt admins)
    const resolved = await resolveSender(sock, sender, jid)
    if (await isSenderAdmin(sock, jid, resolved)) return

    // STEP 6: Get action mode (if invalid, return)
    const action = settings.antigroupmentionAction || 'warn'
    if (!['warn', 'delete', 'remove'].includes(action)) return

    // STEP 7: Get sender number for mentions
    const senderNum = jidToNum(resolved)
    const kickJid = resolved.endsWith('@lid') ? resolved : senderNum + '@s.whatsapp.net'

    // STEP 8: Wait 1 second before deleting (avoid WhatsApp bubble bug)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // STEP 9: Delete the offending message
    try {
      await sock.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          id: msg.key.id,
          fromMe: false,
          participant: sender
        }
      })
    } catch (delErr) {
      // If delete fails, don't continue with punishment
      logger.error(`[AGM] Delete failed: ${delErr.message}`)
      return
    }

    // STEP 10: Apply punishment based on mode
    if (action === 'delete') {
      // Silent mode — just delete, no message
      logger.info(`[AGM] Silent delete: ${senderNum}`)
      return
    }

    if (action === 'remove') {
      // Instant kick
      try {
        await sock.groupParticipantsUpdate(jid, [kickJid], 'remove')
        await sock.sendMessage(jid, {
          text: 
                '🚫 @' + senderNum + ' has been removed!\n' +
                'For mentioning this group in their status\n' +
                '',
          mentions: [kickJid]
        })
        logger.info(`[AGM] Removed ${senderNum}`)
      } catch (err) {
        await sock.sendMessage(jid, {
          text:  
                '⚠️ Failed to remove @' + senderNum + '\n' +
                '📢 Please kick manually\n' +
                '',
          mentions: [kickJid]
        })
      }
      return
    }

    if (action === 'warn') {
      // Warning system
      const count = addWarn(jid, senderNum, 'antigroupmention')
      
      if (count >= 3) {
        // Reset and kick at 3 warnings
        resetWarns(jid, senderNum)
        try {
          await sock.groupParticipantsUpdate(jid, [kickJid], 'remove')
          await sock.sendMessage(jid, {
            text: 
                  '🚨 @' + senderNum + ' removed after *3 warnings!*\n' +
                  '*_Farewell_*\n' +
                  '',
            mentions: [kickJid]
          })
          logger.info(`[AGM] Removed ${senderNum} after 3 warnings`)
        } catch (err) {
          await sock.sendMessage(jid, {
            text: '\n' +
                  '⚠️ @' + senderNum + ' reached 3 warnings\n' +
                  '📢 But kick failed — remove manually\n' +
                  '',
            mentions: [kickJid]
          })
        }
      } else {
        // Just warn
        await sock.sendMessage(jid, {
          text: 
                '⚠️ *Warning ' + count + '/3* — @' + senderNum + '\n' +
                'Do not mention this group in your status!\n' +
                (count === 2 ? '🚨 *One more = removal!*\n' : '') +
                '',
          mentions: [kickJid]
        })
        logger.info(`[AGM] Warning ${count}/3 for ${senderNum}`)
      }
      return
    }

  } catch (err) {
    logger.error(`[AGM] Error: ${err.message}`)
  }
}
