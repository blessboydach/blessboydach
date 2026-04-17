// ============================================================
//  VANGUARD MD — commands/antilink.js
//  No Empty Bubbles Edition 🗿
// ============================================================

const { isBotAdmin, isSenderAdmin, saveGroupSettings, getGroupSettings, addWarn, resetWarns, jidToNum } = require('../lib/utils')

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

const PROTOCOL_REGEX    = /https?:\/\/[^\s]+|ftp:\/\/[^\s]+/i
const WWW_REGEX         = /www\.[a-z0-9-]+\.[a-z]{2,}[^\s]*/i
const WA_REGEX          = /chat\.whatsapp\.com\/[^\s]+/i
const SHORTENER_REGEX   = /\b(?:bit\.ly|t\.me|tinyurl\.com|goo\.gl|ow\.ly|buff\.ly|rb\.gy|is\.gd|short\.io|tiny\.cc|cutt\.ly|youtu\.be|vm\.tiktok\.com|instagram\.com|facebook\.com|fb\.com|twitter\.com|x\.com|telegram\.me|discord\.gg|discord\.com\/invite|linktr\.ee|wa\.me)\/[^\s]*/i
const BARE_DOMAIN_REGEX = /\b[a-z0-9-]{2,}\.(com|net|org|io|co|app|dev|xyz|info|biz|gg|tv|me|ly|link|site|web|online|store|shop|live|news|media|tech|ai|cloud)(?:\/[^\s]*)?\b/i

const containsLink = (text) => {
  if (!text || typeof text !== 'string') return false
  return (
    PROTOCOL_REGEX.test(text)  ||
    WWW_REGEX.test(text)       ||
    WA_REGEX.test(text)        ||
    SHORTENER_REGEX.test(text) ||
    BARE_DOMAIN_REGEX.test(text)
  )
}

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo, sock } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  // STEP 1: Check bot admin status FIRST (don't waste time)
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply(
    '🔗 *ANTI LINK*\n' +
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
      '🔗 *ANTI LINK*\n' +
      '❌ Usage: *.antilink <action> on/off*\n' +
      '*Actions:*\n' +
      '• warn   — Warn (3 = kick)\n' +
      '• delete — Silent delete only\n' +
      '• remove — Delete + instant kick\n' +
      '📍 *Current:* ' + (settings.antilink ? 'ON ✅' : 'OFF ❌') + '\n' +
      '⚙️ *Action:* ' + (settings.antilinkAction || 'warn') + '\n' +
      '_Example: .antilink warn on_\n' +
      ''
    )
  }

  saveGroupSettings(jid, {
    antilink:       state === 'on',
    antilinkAction: action,
  })

  await reply(
    '🔗 *ANTI LINK*\n' +
    (state === 'on'
      ? '✅ *ON* — Action: *' + action.toUpperCase() + '*\n' +
        '_Links sent by non-admins will be ' +
        (action === 'warn'   ? 'warned (3 = kick)' :
         action === 'delete' ? 'silently deleted' :
                               'deleted + user kicked') + '_\n'
      : '❌ *OFF* — Links are now allowed\n') +
    ''
  )
}

// ── ENFORCER (Fixed Order - No Empty Bubbles) ─────────────────
module.exports.enforce = async (sock, msg, jid, sender) => {
  try {
    // STEP 1: Get settings first
    const settings = getGroupSettings(jid)
    
    // STEP 2: If antilink is OFF, return immediately
    if (!settings.antilink) return

    // STEP 3: Check if it's actually a link
    const body = (
      msg.message?.conversation                          ||
      msg.message?.extendedTextMessage?.text             ||
      msg.message?.imageMessage?.caption                 ||
      msg.message?.videoMessage?.caption                 ||
      msg.message?.documentMessage?.caption              ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      ''
    )

    if (!containsLink(body)) return

    // STEP 4: Check if bot is admin (DON'T WASTE TIME IF NOT)
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return

    // STEP 5: Check if sender is admin (exempt admins)
    const senderAdmin = await isSenderAdmin(sock, jid, sender)
    if (senderAdmin) return

    // STEP 6: Get action mode (if invalid, return)
    const action = settings.antilinkAction || 'warn'
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
      logger.error(`[ANTILINK] Delete failed: ${delErr.message}`)
      return
    }

    // STEP 10: Apply punishment based on mode
    if (action === 'delete') {
      // Silent mode — just delete, no message
      logger.info(`[ANTILINK] Silent delete: ${senderNum}`)
      return
    }

    if (action === 'warn') {
      const newCount = addWarn(jid, senderNum, 'antilink')

      if (newCount >= 3) {
        // Reset and kick at 3 warnings
        resetWarns(jid, senderNum)
        try {
          await sock.groupParticipantsUpdate(jid, [sender], 'remove')
          await sock.sendMessage(jid, {
            text:
              '🚨 @' + senderNum + ' removed after *3 warnings!*\n' +
              'For Sending links here\n' +
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
            '🔗 _Links are not allowed in this group!_\n' +
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
            '🚫 @' + senderNum + ' removed for sending a link!\n' +
            '',
          mentions: [sender],
        })
      } catch (kickErr) {
        await sock.sendMessage(jid, {
          text:
            '⚠️ @' + senderNum + ' sent a link\n' +
            '❌ _Could not remove — please kick manually_\n' +
            '',
          mentions: [sender],
        })
      }
      return
    }

  } catch (err) {
    logger.error('[ANTILINK] Error: ' + err.message)
  }
}
