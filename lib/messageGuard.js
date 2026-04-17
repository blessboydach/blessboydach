// ============================================================
//  VANGUARD MD — lib/messageGuard.js
//  REAL CHARACTERS ONLY — Ghosts get the 🌚🌝 treatment
// ============================================================

const logger = require('./logger')

// Check if string contains ANY real character (not just whitespace/control chars)
function hasRealCharacters(str) {
  if (typeof str !== 'string') return false
  // Remove whitespace, zero-width chars, control chars — check if anything remains
  const cleaned = str.replace(/[\s\u200B-\u200F\uFEFF\u0000-\u001F\u007F-\u009F]/g, '')
  return cleaned.length > 0
}

function isValidMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    logger.debug('🌚🌝 Null message')
    return false
  }

  // ✅ ABSOLUTE WHITELIST — No text validation needed
  if (msg.delete) return true
  if (msg.reaction) return true
  if (msg.poll) return true
  if (msg.location || msg.liveLocation) return true
  if (msg.contacts || msg.contactArray) return true
  if (msg.groupParticipantsUpdate) return true
  if (msg.protocolMessage) return true
  if (msg.sticker) return true

  // ✅ MEDIA — Check caption if present
  if (msg.image || msg.video || msg.audio || msg.document) {
    if (msg.caption && !hasRealCharacters(msg.caption)) {
      logger.debug('🌚🌝 Ghost caption on media')
      return false
    }
    return true
  }

  // ✅ TEXT — Must have real characters (emojis, symbols, letters, numbers all pass)
  if (msg.text !== undefined) {
    if (!hasRealCharacters(msg.text)) {
      logger.debug('🌚🌝 Ghost text')
      return false
    }
    return true
  }

  // ✅ STANDALONE CAPTION
  if (msg.caption !== undefined) {
    if (!hasRealCharacters(msg.caption)) {
      logger.debug('🌚🌝 Ghost caption')
      return false
    }
    return true
  }

  // ❌ UNKNOWN TYPES
  logger.debug('🌚🌝 Unknown type')
  return false
}

function wrapSend(sock) {
  const originalSend = sock.sendMessage.bind(sock)

  sock.sendMessage = async (jid, msg, ...args) => {
    try {
      if (!isValidMessage(msg)) {
        // Silent ghost — you see 🌚🌝 in logs, nothing sent
        return null
      }

      return await originalSend(jid, msg, ...args)

    } catch (err) {
      logger.error(`🛡️ sendMessage error: ${err.message}`)
      throw err
    }
  }
}

module.exports = { wrapSend }
