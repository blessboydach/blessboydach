// ============================================================
// VANGUARD MD — commands/sticker.js
// Convert image/video/gif → WhatsApp Sticker
// Dynamic: uses wa-sticker-formatter if installed, else raw FFmpeg
// ============================================================

'use strict'

const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const config = require('../config')
const defaults = require('../defaults')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const fs = require('fs').promises
const path = require('path')
const os = require('os')

// Try to load wa-sticker-formatter (optional dependency)
let Sticker, StickerTypes
try {
  const stickerLib = require('wa-sticker-formatter')
  Sticker = stickerLib.Sticker
  StickerTypes = stickerLib.StickerTypes
} catch (_) {
  Sticker = null
  StickerTypes = null
}

// ── Supported types ─────────────────────────────────────────
const TYPES = new Set([
  'imageMessage',
  'videoMessage',
  'documentMessage'
])

const DOC_MIMES = new Set([
  'image/jpeg','image/png','image/webp',
  'video/mp4','video/webm','video/gif'
])

// ── Download media ──────────────────────────────────────────
const downloadBuffer = async (sock, msg) => {
  return downloadMediaMessage(
    msg,
    'buffer',
    {},
    {
      logger: { info: () => {}, error: console.error, warn: () => {}, debug: () => {} },
      reuploadRequest: sock.updateMediaMessage
    }
  )
}

// ── Extract media metadata ──────────────────────────────────
function getMediaMetadata(msg) {
  const type = Object.keys(msg)[0]
  const content = msg[type]
  if (!content) return { width: 0, height: 0, fileLength: 0 }

  return {
    width: content.width || 0,
    height: content.height || 0,
    fileLength: content.fileLength || 0
  }
}

// ── Video compressor (only used when wa-sticker-formatter is present) ──
async function compressVideoForSticker(inputBuffer) {
  const tmpDir = os.tmpdir()
  const input = path.join(tmpDir, `in_${Date.now()}.mp4`)
  const output = path.join(tmpDir, `out_${Date.now()}.mp4`)

  await fs.writeFile(input, inputBuffer)

  try {
    await execPromise(
      `ffmpeg -y -i "${input}" -vf "scale=320:320:force_original_aspect_ratio=decrease:flags=lanczos,fps=10" -t 6 -c:v libx264 -b:v 400k -pix_fmt yuv420p "${output}"`
    )
    const out = await fs.readFile(output)
    return out
  } catch (_) {
    return inputBuffer
  } finally {
    try { await fs.unlink(input) } catch (_) {}
    try { await fs.unlink(output) } catch (_) {}
  }
}

// ── Command ─────────────────────────────────────────────────
module.exports = async (ctx) => {
  const { sock, msg, jid } = ctx

  // resolve quoted
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  let target = msg

  if (quoted) {
    const type = Object.keys(quoted)[0]
    if (TYPES.has(type)) {
      target = {
        key: msg.key,
        message: quoted
      }
    }
  }

  const type = Object.keys(target.message || {})[0]

  // validate
  if (!TYPES.has(type)) {
    return sock.sendMessage(jid, {
      text: 'Reply to an image or video\nExample:\n.sticker'
    }, { quoted: msg })
  }

  if (type === 'documentMessage') {
    const mime = target.message.documentMessage?.mimetype || ''
    if (!DOC_MIMES.has(mime.split(';')[0])) {
      return sock.sendMessage(jid, {
        text: 'Unsupported file type. Send image/video'
      }, { quoted: msg })
    }
  }

  // download
  let buffer
  try {
    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } })
    buffer = await downloadBuffer(sock, target)
  } catch (e) {
    return sock.sendMessage(jid, {
      text: 'Media expired, resend it'
    }, { quoted: msg })
  }

  const isVideo = (
    type === 'videoMessage' ||
    (type === 'documentMessage' && target.message.documentMessage?.mimetype?.startsWith('video'))
  )

  try {
    // ── PATH 1: wa-sticker-formatter available ───────────────
    if (Sticker && StickerTypes) {
      if (isVideo) {
        buffer = await compressVideoForSticker(buffer)
      }

      const { width, height, fileLength } = getMediaMetadata(target.message)
      const fileSize = fileLength || buffer.length
      const isSmall = (width <= 320 && height <= 320 && fileSize < 300 * 1024)
      const stickerType = isSmall ? StickerTypes.FULL : StickerTypes.DEFAULT
      const quality = isSmall ? 60 : 30

      const botName = config.botName || defaults.botName || 'Vanguard MD'
      const sticker = new Sticker(buffer, {
        pack: botName,
        author: 'Blue 𓃵',
        type: stickerType,
        categories: ['🤖', '🗿'],
        id: 'vanguard-md',
        quality: quality,
        background: '#00000000'
      })

      const stickerBuffer = await sticker.toBuffer()
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg })
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } })
      return
    }

    // ── PATH 2: raw FFmpeg fallback (no metadata) ────────────
    const tmpDir = os.tmpdir()
    const ts = Date.now()
    const inputPath = path.join(tmpDir, `vanguard_in_${ts}`)
    const outputPath = path.join(tmpDir, `vanguard_out_${ts}.webp`)

    await fs.writeFile(inputPath, buffer)

    const { width, height, fileLength } = getMediaMetadata(target.message)
    const fileSize = fileLength || buffer.length
    const isSmall = (width <= 320 && height <= 320 && fileSize < 300 * 1024)

    let ffmpegCmd = ''

    if (isVideo) {
      const qualityFactor = isSmall ? 65 : 40
      const maxDuration = 6
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vcodec libwebp -filter_complex "scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=12" -loop 0 -vsync 0 -t ${maxDuration} -quality ${qualityFactor} -an "${outputPath}"`
    } else {
      const qualityFactor = isSmall ? 85 : 70
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vcodec libwebp -filter_complex "scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -quality ${qualityFactor} "${outputPath}"`
    }

    await execPromise(ffmpegCmd)
    const webpBuffer = await fs.readFile(outputPath)

    await sock.sendMessage(jid, { sticker: webpBuffer }, { quoted: msg })
    await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } })

    await fs.unlink(inputPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})

  } catch (e) {
    console.error('Sticker Error:', e)
    await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } })
    return sock.sendMessage(jid, {
      text: `Failed to create sticker: ${e.message}`
    }, { quoted: msg })
  }
}
