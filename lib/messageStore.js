// ============================================================
//  VANGUARD MD — lib/messageStore.js
//  Local message, status, view-once storage + cleanup
// ============================================================

const fs = require('fs')
const path = require('path')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino     = require('pino')
const logger   = require('./logger')
const config   = require('../config')
const defaults = require('../defaults')

const MSGS_DIR   = path.join(__dirname, '..', 'src', 'session_msgs')
const VO_DIR     = path.join(__dirname, '..', 'src', 'session_vo')
const MEDIA_DIR  = path.join(__dirname, '..', 'src', 'session_media')

// ── Separate ages — msgs kept longer for antidelete ──────────
const MSGS_MAX_AGE_MS  = 6  * 60 * 60 * 1000  // 6hrs for messages
const MEDIA_MAX_AGE_MS = 6  * 60 * 60 * 1000  // 6hrs for media
const VO_MAX_AGE_MS    = 24 * 60 * 60 * 1000  // 24hrs for viewonce

// ── Ensure directories exist ──────────────────────────────────
;[MSGS_DIR, VO_DIR, MEDIA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// ── In-memory index ───────────────────────────────────────────
const memoryIndex = new Map()

// ── Extract text body ─────────────────────────────────────────
const extractBody = (msg) => {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  )
}

// ── Detect media type ─────────────────────────────────────────
const getMediaType = (msg) => {
  const m = msg.message
  if (!m) return null
  if (m.imageMessage)    return 'image'
  if (m.videoImage)      return 'video'
  if (m.videoMessage)    return 'video'
  if (m.audioMessage)    return 'audio'
  if (m.documentMessage) return 'document'
  if (m.stickerMessage)  return 'sticker'
  return null
}

// ── Full document info ────────────────────────────────────────
const getDocumentInfo = (msg) => {
  const doc = msg.message?.documentMessage
  if (!doc) return { ext: '.bin', mimetype: 'application/octet-stream', filename: null }
  const filename = doc.fileName || null
  const mime     = doc.mimetype || ''
  const mimeMap  = {
    'application/pdf':                                                            '.pdf',
    'application/zip':                                                            '.zip',
    'application/x-zip-compressed':                                              '.zip',
    'application/vnd.rar':                                                        '.rar',
    'application/x-rar-compressed':                                               '.rar',
    'application/x-7z-compressed':                                                '.7z',
    'application/x-tar':                                                          '.tar',
    'application/gzip':                                                           '.gz',
    'application/msword':                                                         '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   '.docx',
    'application/vnd.ms-excel':                                                   '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':         '.xlsx',
    'application/vnd.ms-powerpoint':                                              '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain':                                                                 '.txt',
    'text/csv':                                                                   '.csv',
    'text/html':                                                                  '.html',
    'application/json':                                                           '.json',
    'application/javascript':                                                     '.js',
    'application/xml':                                                            '.xml',
    'application/epub+zip':                                                       '.epub',
    'application/vnd.android.package-archive':                                    '.apk',
    'application/x-msdownload':                                                   '.exe',
    'application/x-sh':                                                           '.sh',
    'image/svg+xml':                                                              '.svg',
  }
  let ext = mimeMap[mime] || null
  if (!ext && filename) { const m = filename.match(/\.[^.]+$/); if (m) ext = m[0] }
  if (!ext) ext = '.bin'
  return { ext, mimetype: mime || 'application/octet-stream', filename }
}

// ── Audio info ────────────────────────────────────────────────
const getAudioInfo = (msg) => {
  const audio = msg.message?.audioMessage
  if (!audio) return { ext: '.ogg', mimetype: 'audio/ogg; codecs=opus', ptt: false }
  return {
    ext:      audio.ptt ? '.ogg' : '.mp3',
    mimetype: audio.mimetype || (audio.ptt ? 'audio/ogg; codecs=opus' : 'audio/mpeg'),
    ptt:      audio.ptt ?? false,
  }
}

// ── Get file extension per media type ─────────────────────────
const getMediaExt = (mediaType, msg) => {
  switch (mediaType) {
    case 'image':    return '.jpg'
    case 'video':    return '.mp4'
    case 'sticker':  return '.webp'
    case 'audio':    return getAudioInfo(msg).ext
    case 'document': return getDocumentInfo(msg).ext
    default:         return '.bin'
  }
}

// ── Download and save media to disk ──────────────────────────
const downloadAndSaveMedia = async (msg, msgId) => {
  try {
    const mediaType = getMediaType(msg)
    if (!mediaType) return null

    const ext       = getMediaExt(mediaType, msg)
    const mediaPath = path.join(MEDIA_DIR, `${msgId}${ext}`)

    if (fs.existsSync(mediaPath)) return mediaPath

    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      { logger: pino({ level: 'silent' }) }
    )

    if (!buffer || !buffer.length) return null

    fs.writeFileSync(mediaPath, buffer)
    logger.info(`💾 Media saved: ${msgId}${ext} (${(buffer.length / 1024).toFixed(1)} KB)`)
    return mediaPath

  } catch (err) {
    logger.error(`💾 Media download error: ${err.message}`)
    return null
  }
}

// ── Save incoming message — no raw field ─────────────────────
const saveMessage = async (msg, sender, jid) => {
  try {
    const id        = msg.key.id
    const timestamp = msg.messageTimestamp || Math.floor(Date.now() / 1000)
    const body      = extractBody(msg)
    const mediaType = getMediaType(msg)

    // ── Only save media if antidelete is ON ───────────────
    let mediaPath = null
    if (mediaType && (config.antidelete ?? defaults.antidelete)) {
      mediaPath = await downloadAndSaveMedia(msg, id)
    }

    let mimetype = null
    let fileName = null
    let ptt      = null

    if (mediaType === 'document') {
      const info = getDocumentInfo(msg)
      mimetype   = info.mimetype
      fileName   = info.filename
    }
    if (mediaType === 'audio') {
      const info = getAudioInfo(msg)
      mimetype   = info.mimetype
      ptt        = info.ptt
    }

    // ── Lean entry — no raw field 🗿 ──────────────────────
    const entry = {
      id,
      sender,
      jid,
      pushName:  msg.pushName || null,
      body,
      mediaType,
      mediaPath,
      mimetype,
      fileName,
      ptt,
      caption:   body,
      fromMe:    msg.key.fromMe ?? false,
      timestamp: timestamp * 1000,
      savedAt:   Date.now(),
    }

    const file = path.join(MSGS_DIR, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(entry))  // no pretty print = smaller file
    memoryIndex.set(id, entry)

  } catch (err) {
    logger.error(`💾 saveMessage error: ${err.message}`)
  }
}

// ── Get stored message by ID ──────────────────────────────────
saveMessage.getStored = (id) => {
  if (memoryIndex.has(id)) return memoryIndex.get(id)
  try {
    const file = path.join(MSGS_DIR, `${id}.json`)
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      memoryIndex.set(id, data)
      return data
    }
  } catch (_) {}
  return null
}

// ── Get all stored messages for a chat ───────────────────────
const getStoredMessages = (jid) => {
  try {
    const fromMemory = []
    for (const entry of memoryIndex.values()) {
      if (entry.jid === jid) fromMemory.push(entry)
    }
    if (fromMemory.length > 0) return fromMemory.sort((a, b) => a.timestamp - b.timestamp)

    const files   = fs.readdirSync(MSGS_DIR).filter(f => f.endsWith('.json'))
    const results = []
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(MSGS_DIR, file), 'utf8'))
        if (data.jid === jid) { memoryIndex.set(data.id, data); results.push(data) }
      } catch (_) {}
    }
    return results.sort((a, b) => a.timestamp - b.timestamp)
  } catch (err) {
    logger.error(`💾 getStoredMessages error: ${err.message}`)
    return []
  }
}

// ── Save view once ────────────────────────────────────────────
const saveViewOnce = async (msg, sender, jid) => {
  try {
    const id = msg.key.id
    const m  = msg.message
    const voContent = (
      m?.viewOnceMessage?.message ||
      m?.viewOnceMessageV2?.message ||
      m?.viewOnceMessageV2Extension?.message ||
      null
    )
    if (!voContent) return

    const voMsg     = { message: voContent, key: msg.key }
    const mediaType = getMediaType(voMsg)
    let mediaPath   = null
    let mimetype    = null
    let fileName    = null
    let ptt         = null

    if (mediaType) {
      mediaPath = await downloadAndSaveMedia(voMsg, `vo_${id}`)
      if (mediaType === 'document') {
        const info = getDocumentInfo(voMsg)
        mimetype   = info.mimetype
        fileName   = info.filename
      }
      if (mediaType === 'audio') {
        const info = getAudioInfo(voMsg)
        mimetype   = info.mimetype
        ptt        = info.ptt
      }
    }

    // ── No raw field in viewonce either 🗿 ────────────────
    const entry = {
      id,
      sender,
      jid,
      pushName:  msg.pushName || null,
      savedAt:   Date.now(),
      timestamp: (msg.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000,
      type:      Object.keys(voContent)[0] || 'unknown',
      caption:   voContent?.imageMessage?.caption || voContent?.videoMessage?.caption || '',
      mediaType,
      mediaPath,
      mimetype,
      fileName,
      ptt,
    }

    const file = path.join(VO_DIR, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(entry))
    logger.info(`👁️  View-once saved: ${id} from ${sender.split('@')[0]}`)

  } catch (err) {
    logger.error(`💾 saveViewOnce error: ${err.message}`)
  }
}

// ── Get view once by ID ───────────────────────────────────────
const getViewOnce = (id) => {
  try {
    const file = path.join(VO_DIR, `${id}.json`)
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (_) {}
  return null
}

// ── Cleanup with separate ages per folder ─────────────────────
const cleanupOldFiles = (dir, maxAge) => {
  try {
    let count = 0
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file)
      try {
        if (Date.now() - fs.statSync(filePath).mtimeMs > maxAge) {
          fs.unlinkSync(filePath)
          count++
        }
      } catch (_) {}
    }
    if (count > 0) logger.info(`🧹 Cleaned ${count} old files from ${path.basename(dir)}`)
  } catch (_) {}
}

// ── Clean memory index ────────────────────────────────────────
const cleanMemoryIndex = () => {
  const now = Date.now()
  let count = 0
  for (const [key, val] of memoryIndex.entries()) {
    if (now - val.savedAt > MSGS_MAX_AGE_MS) { memoryIndex.delete(key); count++ }
  }
  if (count > 0) logger.info(`🧹 Cleared ${count} entries from memory index`)
}

// ── Start cleanup scheduler ───────────────────────────────────
const startCleanupScheduler = () => {
  logger.info('⏱️  24hr cleanup scheduler started')
  setInterval(() => {
    logger.info('🧹 Running scheduled cleanup...')
    cleanupOldFiles(MSGS_DIR,  MSGS_MAX_AGE_MS)   // 6hrs
    cleanupOldFiles(VO_DIR,    VO_MAX_AGE_MS)     // 24hrs
    cleanupOldFiles(MEDIA_DIR, MEDIA_MAX_AGE_MS)  // 6hrs
    cleanMemoryIndex()
  }, MSGS_MAX_AGE_MS)  // runs every 6hrs
}

module.exports = {
  saveMessage,
  saveViewOnce,
  getViewOnce,
  getStoredMessages,
  startCleanupScheduler,
}
