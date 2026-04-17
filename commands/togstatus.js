// ============================================================
//  VANGUARD MD — commands/togstatus.js
//  Group Status / Text Status / Media Status (System FFmpeg)
//  Made with love by Mr.Admin Blue 2026
// ============================================================

const crypto = require('crypto')
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys')

const { PassThrough } = require('stream')
const ffmpeg = require('fluent-ffmpeg')
const { isSenderAdmin } = require('../lib/utils')

const PURPLE_COLOR = '#9C27B0'
const DEFAULT_CAPTION = '_Vanguard MD is on Fire 🔥_'

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, msg, quoted, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const userText = args.join(' ').trim()

  try {
    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
    const quotedMsg = ctxInfo?.quotedMessage || quoted?.message || null
    const hasQuoted = !!quotedMsg

    // ── TEXT STATUS ─────────────────────────────────────────
    if (!hasQuoted) {
      if (!userText) {
        return reply(
          '📝 *Group Status Usage*\n' +
          '• Reply to image/video with:\n' +
          '  `.togstatus [optional caption]`\n' +
          '• Or send text only:\n' +
          '  `.togstatus Your text here`\n' +
          'Text statuses use a purple background by default.'
        )
      }

      await reply('⏳ Posting text group status...')
      await groupStatus(sock, jid, { text: userText, backgroundColor: PURPLE_COLOR })
      return reply('✅ Text group status posted!')
    }

    const mtype = Object.keys(quotedMsg)[0] || ''

    // ── IMAGE ───────────────────────────────────────────────
    if (/image/i.test(mtype)) {
      await reply('⏳ Posting image group status...')
      const buf = await downloadMedia(quotedMsg, 'image')
      const quotedCaption = quotedMsg.imageMessage?.caption || ''
      const finalCaption = userText || quotedCaption || DEFAULT_CAPTION

      await groupStatus(sock, jid, { image: buf, caption: finalCaption })
      return reply('✅ Image group status posted!')
    }

    // ── VIDEO ───────────────────────────────────────────────
    if (/video/i.test(mtype)) {
      await reply('⏳ Posting video group status...')
      const buf = await downloadMedia(quotedMsg, 'video')
      const quotedCaption = quotedMsg.videoMessage?.caption || ''
      const finalCaption = userText || quotedCaption || DEFAULT_CAPTION

      await groupStatus(sock, jid, { video: buf, caption: finalCaption })
      return reply('✅ Video group status posted!')
    }

    // ── AUDIO / VOICE ───────────────────────────────────────
    if (/audio/i.test(mtype)) {
      await reply('⏳ Posting audio group status...')
      const buf = await downloadMedia(quotedMsg, 'audio')

      let vn = buf
      try { vn = await toVN(buf) } catch (e) { console.log('toVN skipped') }

      let waveform
      try { waveform = await generateWaveform(buf) } catch (e) { console.log('waveform skipped') }

      await groupStatus(sock, jid, {
        audio: vn,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        waveform,
      })
      return reply('✅ Audio group status posted!')
    }

    // ── STICKER ─────────────────────────────────────────────
    if (/sticker/i.test(mtype)) {
      await reply('⏳ Posting sticker group status...')
      const buf = await downloadMedia(quotedMsg, 'sticker')
      await groupStatus(sock, jid, { image: buf })
      return reply('✅ Sticker group status posted!')
    }

    return reply('❌ Unsupported media type.')
  } catch (e) {
    console.error('togstatus error:', e)
    return reply('❌ Error: ' + (e.message || e))
  }
}

// ==================== HELPERS ====================

async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg
  const stream = await downloadContentFromMessage(mediaMsg, type)
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content
  delete content.backgroundColor

  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: backgroundColor || PURPLE_COLOR,
  })

  const secret = crypto.randomBytes(32)

  const msg = generateWAMessageFromContent(jid, {
    messageContextInfo: { messageSecret: secret },
    groupStatusMessageV2: {
      message: {
        ...inside,
        messageContextInfo: { messageSecret: secret },
      },
    },
  }, {})

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
}

async function toVN(buffer) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough()
    const output = new PassThrough()
    const chunks = []

    output.on('data', chunk => chunks.push(chunk))
    output.on('end', () => resolve(Buffer.concat(chunks)))
    output.on('error', reject)

    input.end(buffer)

    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .audioChannels(1)
      .audioFrequency(48000)
      .format('ogg')
      .on('error', reject)
      .pipe(output, { end: true })
  })
}

async function generateWaveform(buffer, bars = 64) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough()
    const output = new PassThrough()
    const chunks = []

    output.on('data', chunk => chunks.push(chunk))
    output.on('error', reject)
    output.on('end', () => {
      try {
        const raw = Buffer.concat(chunks)
        if (!raw.length) return resolve(undefined)

        const sampleCount = Math.floor(raw.length / 2)
        const amplitudes = []
        for (let i = 0; i < sampleCount; i++) {
          amplitudes.push(Math.abs(raw.readInt16LE(i * 2)) / 32768)
        }

        const size = Math.floor(amplitudes.length / bars)
        const barsData = Array.from({ length: bars }, (_, i) => {
          const slice = amplitudes.slice(i * size, (i + 1) * size)
          return slice.length ? slice.reduce((a, b) => a + b) / slice.length : 0
        })

        const max = Math.max(...barsData) || 1
        const normalized = barsData.map(v => Math.floor((v / max) * 100))
        resolve(Buffer.from(normalized).toString('base64'))
      } catch (err) {
        reject(err)
      }
    })

    input.end(buffer)

    ffmpeg(input)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('error', reject)
      .pipe(output, { end: true })
  })
}