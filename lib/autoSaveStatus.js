// ============================================================
//  VANGUARD MD — lib/autoSaveStatus.js
//  Background status saver — non-blocking, zero disk waste
// ============================================================

const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino     = require('pino')
const path     = require('path')
const fs       = require('fs')
const config   = require('../config')
const defaults = require('../defaults')
const logger   = require('./logger')

// ── Rate limit — prevent flooding owner DM ───────────────────
const recentlySent = new Map() // sender → timestamp
const RATE_LIMIT_MS = 30000    // max 1 status per sender per 30s

// ── Extract body ──────────────────────────────────────────────
const extractBody = (msg) => {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation              ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption     ||
    m.videoMessage?.caption     ||
    m.documentMessage?.caption  ||
    ''
  )
}

// ── Detect media type ─────────────────────────────────────────
const getMediaType = (msg) => {
  const m = msg.message
  if (!m) return null
  if (m.imageMessage)    return 'image'
  if (m.videoMessage)    return 'video'
  if (m.audioMessage)    return 'audio'
  if (m.stickerMessage)  return 'sticker'
  return null
}

// ── Check if sender passes the filter ────────────────────────
const passesFilter = (sender, pushName, mode, numbers) => {
  const senderNum = sender
    .replace('@s.whatsapp.net', '')
    .replace('@lid', '')
    .replace(/:[0-9]+@/, '')
    .trim()

  switch (mode) {
    case 'all':
      return true

    case 'contacts':
      // pushName exists = saved contact
      return !!pushName

    case 'group':
      // handled separately in main.js via groupStatusMentionMessage
      return false

    case 'numbers': {
      if (!numbers || !numbers.length) return false
      return numbers.some(n =>
        n.replace(/[^0-9]/g, '') === senderNum.replace(/[^0-9]/g, '')
      )
    }

    default:
      return false
  }
}

// ── Main handler — called from main.js ───────────────────────
const handleAutoSaveStatus = async (sock, msg, sender) => {
  try {
    const mode    = config.autoSaveStatus    ?? defaults.autoSaveStatus    ?? 'off'
    const numbers = config.autoSaveStatusNumbers ?? defaults.autoSaveStatusNumbers ?? []

    if (!mode || mode === 'off') return

    const pushName  = msg.pushName || null
    const senderNum = sender
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace(/:[0-9]+@/, '')
      .trim()

    // ── Filter check ─────────────────────────────────────
    if (!passesFilter(sender, pushName, mode, numbers)) return

    // ── Rate limit check ─────────────────────────────────
    const lastSent = recentlySent.get(senderNum) || 0
    if (Date.now() - lastSent < RATE_LIMIT_MS) return
    recentlySent.set(senderNum, Date.now())

    const ownerJid  = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
    const botName   = config.botName || defaults.botName || 'VANGUARD MD'
    const mediaType = getMediaType(msg)
    const caption   = extractBody(msg)
    const time      = new Date((msg.messageTimestamp || Date.now() / 1000) * 1000)
      .toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: true })

    // ── Build header ──────────────────────────────────────
    const header =
      '╭───────────────━⊷\n' +
      '┃ *🤖 ' + botName + ' 🤖*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 📸 *AUTO SAVED STATUS*\n' +
      '┃\n' +
      '┃ 👤 *From:* ' + (pushName ? '*' + pushName + '* ' : '') + '+' + senderNum + '\n' +
      '┃ 🕐 *Time:* ' + time + '\n' +
      (caption ? '┃ 💬 *Caption:* ' + caption + '\n' : '') +
      '╰───────────────━⊷'

    // ── Text status ───────────────────────────────────────
    if (!mediaType) {
      if (!caption) return  // nothing to save
      await sock.sendMessage(ownerJid, { text: header })
      logger.info(`📸 AutoSave: text status from ${senderNum}`)
      return
    }

    // ── Download media ────────────────────────────────────
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      { logger: pino({ level: 'silent' }) }
    )

    if (!buffer || !buffer.length) return

    // ── Send header first ─────────────────────────────────
    await sock.sendMessage(ownerJid, { text: header })

    // ── Send media ────────────────────────────────────────
    const payload = { [mediaType]: buffer }
    if (caption)              payload.caption  = caption
    if (mediaType === 'audio') payload.ptt     = false
    await sock.sendMessage(ownerJid, payload)

    // ── Buffer released by GC — no disk write ever ────────
    logger.info(`📸 AutoSave: ${mediaType} status from ${senderNum} (${(buffer.length / 1024).toFixed(1)} KB)`)

  } catch (err) {
    logger.error(`📸 AutoSave error: ${err.message}`)
  }
}

// ── Group status mention handler ──────────────────────────────
const handleGroupStatusSave = async (sock, msg, sender) => {
  try {
    const mode = config.autoSaveStatus ?? defaults.autoSaveStatus ?? 'off'
    if (mode !== 'group' && mode !== 'all') return

    const senderNum = sender
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace(/:[0-9]+@/, '')
      .trim()

    const lastSent = recentlySent.get('group_' + senderNum) || 0
    if (Date.now() - lastSent < RATE_LIMIT_MS) return
    recentlySent.set('group_' + senderNum, Date.now())

    const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
    const botName  = config.botName || defaults.botName || 'VANGUARD MD'
    const time     = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: true })

    await sock.sendMessage(ownerJid, {
      text:
        '╭───────────────━⊷\n' +
        '┃ *🤖 ' + botName + ' 🤖*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ 👥 *GROUP STATUS MENTION*\n' +
        '┃\n' +
        '┃ 👤 *From:* +' + senderNum + '\n' +
        '┃ 🕐 *Time:* ' + time + '\n' +
        '╰───────────────━⊷'
    })

    logger.info(`📸 AutoSave: group mention from ${senderNum}`)

  } catch (err) {
    logger.error(`📸 AutoSave group error: ${err.message}`)
  }
}

// ── Clean rate limit map every hour ──────────────────────────
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of recentlySent.entries()) {
    if (now - val > RATE_LIMIT_MS * 2) recentlySent.delete(key)
  }
}, 3600000)

module.exports = { handleAutoSaveStatus, handleGroupStatusSave }
