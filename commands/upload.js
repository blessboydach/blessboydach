// ============================================================
//  VANGUARD MD — commands/upload.js
//  Upload any media and return a public URL
// ============================================================

const fs   = require('fs')
const path = require('path')
const { tmpdir } = require('os')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { TelegraPh, UploadFileUgu } = require('../lib/uploader')
const config   = require('../config')
const defaults = require('../defaults')

const getMediaBuffer = async (m) => {
  if (!m) return null

  const types = [
    { key: 'imageMessage',    type: 'image',    ext: '.jpg'  },
    { key: 'videoMessage',    type: 'video',    ext: '.mp4'  },
    { key: 'audioMessage',    type: 'audio',    ext: '.mp3'  },
    { key: 'stickerMessage',  type: 'sticker',  ext: '.webp' },
    { key: 'documentMessage', type: 'document', ext: null    },
  ]

  for (const { key, type, ext } of types) {
    if (!m[key]) continue
    const stream = await downloadContentFromMessage(m[key], type)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const finalExt = ext || path.extname(m[key]?.fileName || '') || '.bin'
    return { buffer: Buffer.concat(chunks), ext: finalExt }
  }

  return null
}

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, reply } = ctx

  let media = await getMediaBuffer(msg.message)
  if (!media && quoted?.message) media = await getMediaBuffer(quoted.message)

  if (!media) return reply(
    '❌ Send or reply to a media file to get a URL!\n' +
    '_Supports: image, video, audio, sticker, document_'
  )

  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  // ── Send uploading message and capture its key ────────────
  const uploadingMsg = await sock.sendMessage(jid, {
    text: '⏳ *Uploading...*'
  }, { quoted: msg })

  const ts       = Date.now()
  const tempPath = path.join(tmpdir(), `vanguard_upload_${ts}${media.ext}`)

  try {
    fs.writeFileSync(tempPath, media.buffer)

    let url = ''
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(media.ext)

    if (isImage) {
      try {
        url = await TelegraPh(tempPath)
      } catch (_) {
        const res = await UploadFileUgu(tempPath)
        url = typeof res === 'string' ? res : (res.url || res.url_full || '')
      }
    } else {
      const res = await UploadFileUgu(tempPath)
      url = typeof res === 'string' ? res : (res.url || res.url_full || '')
    }

    if (!url) return reply('❌ Upload failed — no URL returned.')

    // ── Edit uploading message to the URL ─────────────────
    await sock.sendMessage(jid, {
      text: url,
      edit: uploadingMsg.key,
    })

    // ── Quote the URL with success message ────────────────
    await sock.sendMessage(jid, {
      text:    '✅ *Uploaded Successfully*\n> *_' + botName + ' is on Fire 🔥_*',
    }, { quoted: uploadingMsg })

  } catch (err) {
    await reply('❌ Upload failed: ' + err.message)
  } finally {
    try { fs.unlinkSync(tempPath) } catch (_) {}
  }
}
