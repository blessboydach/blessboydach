// ============================================================
//  VANGUARD MD — commands/tomp3.js
//  Convert video/audio/document → MP3
// ============================================================

'use strict'

const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const os = require('os')

ffmpeg.setFfmpegPath(ffmpegStatic)

// ── Supported types ─────────────────────────────────────────
const TYPES = new Set([
  'videoMessage',
  'audioMessage',
  'documentMessage'
])

const DOC_MIMES = new Set([
  'video/mp4','video/x-matroska','video/x-msvideo','video/quicktime',
  'video/webm','video/3gpp','video/3gpp2',
  'audio/ogg','audio/mpeg','audio/mp4','audio/aac',
  'audio/wav','audio/x-wav','audio/webm'
])

// ── Download media ──────────────────────────────────────────
const downloadBuffer = async (sock, msg) => {
  return downloadMediaMessage(
    msg,
    'buffer',
    {},
    {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    }
  )
}

// ── Temp file ───────────────────────────────────────────────
const toTemp = (buffer, ext) => {
  const file = path.join(os.tmpdir(), `vang_${Date.now()}.${ext}`)
  fs.writeFileSync(file, buffer)
  return file
}

// ── Convert → MP3 ───────────────────────────────────────────
const toMp3 = (input) => {
  return new Promise((resolve, reject) => {
    const output = input.replace(/\.[^.]+$/, '') + '.mp3'

    ffmpeg(input)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(2)
      .audioFrequency(44100)
      .format('mp3')
      .on('end', () => {
        try {
          const buf = fs.readFileSync(output)
          fs.unlinkSync(input)
          fs.unlinkSync(output)
          resolve(buf)
        } catch (e) {
          reject(e)
        }
      })
      .on('error', (err) => reject(err))
      .save(output)
  })
}

// ── Guess extension ─────────────────────────────────────────
const getExt = (msg) => {
  const type = Object.keys(msg.message || {})[0]

  if (type === 'videoMessage') return 'mp4'

  if (type === 'audioMessage') {
    const mime = msg.message.audioMessage?.mimetype || ''
    if (mime.includes('ogg')) return 'ogg'
    if (mime.includes('webm')) return 'webm'
    return 'mp3'
  }

  if (type === 'documentMessage') {
    const name = msg.message.documentMessage?.fileName || ''
    const ext = path.extname(name).replace('.', '')
    if (ext) return ext
    const mime = msg.message.documentMessage?.mimetype || ''
    return mime.split('/')[1]?.split(';')[0] || 'mp4'
  }

  return 'mp4'
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
      text:
        'Reply to a video or audio\n\n' +
        'Example:\n.tomp3'
    }, { quoted: msg })
  }

  if (type === 'documentMessage') {
    const mime = target.message.documentMessage?.mimetype || ''
    if (!DOC_MIMES.has(mime.split(';')[0])) {
      return sock.sendMessage(jid, {
        text: 'Unsupported file type'
      }, { quoted: msg })
    }
  }

  // download
  let buffer
  try {
    buffer = await downloadBuffer(sock, target)
  } catch (e) {
    return sock.sendMessage(jid, {
      text: 'Media expired, resend it'
    }, { quoted: msg })
  }

  // convert
  const ext = getExt(target)
  const input = toTemp(buffer, ext)

  let audio
  try {
    audio = await toMp3(input)
  } catch (e) {
    try { fs.unlinkSync(input) } catch {}
    return sock.sendMessage(jid, {
      text: 'Conversion failed'
    }, { quoted: msg })
  }

  // send
  try {
    await sock.sendMessage(jid, {
      audio,
      mimetype: 'audio/mpeg'
    }, { quoted: msg })
  } catch (e) {
    return sock.sendMessage(jid, {
      text: 'Failed to send audio'
    }, { quoted: msg })
  }
}
