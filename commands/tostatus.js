// ============================================================
//  VANGUARD MD — commands/tostatus.js
//  Post to your own WhatsApp Status (Owner/Sudo only)
//  ✅ Removed ffmpeg-static | Uses system ffmpeg
// ============================================================

const crypto = require('crypto')
const {
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys')

const { PassThrough } = require('stream')
const ffmpeg = require('fluent-ffmpeg')

const PURPLE_COLOR = '#9C27B0'
const DEFAULT_CAPTION = '_Vanguard MD is on Fire 🔥_'
const STATUS_JID = 'status@broadcast'

module.exports = async (ctx) => {
  const { reply, sock, msg, quoted, args, isSudo } = ctx

  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const userText = args.join(' ').trim()

  try {
    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
    const quotedMsg = ctxInfo?.quotedMessage || quoted?.message || null
    const hasQuoted = !!quotedMsg

    // ── TEXT STATUS ─────────────────────────────────────────
    if (!hasQuoted) {
      if (!userText) {
        return reply('📝 Send text or reply to media with .tostatus\n\n💡 Priority: Your text > quoted caption > default')
      }

      await reply('⏳ Posting text status...')
      await sendRealStatus(sock, { text: userText, backgroundColor: PURPLE_COLOR })
      return reply('✅ Text status posted!')
    }

    const mtype = Object.keys(quotedMsg)[0] || ''

    // ── IMAGE ───────────────────────────────────────────────
    if (/image/i.test(mtype)) {
      await reply('⏳ Posting image status...')

      const buf = await downloadMedia(quotedMsg, 'image')
      if (!buf) return reply('❌ Could not download image.')

      const quotedCaption = quotedMsg.imageMessage?.caption || ''
      const finalCaption = userText || quotedCaption || DEFAULT_CAPTION

      await sendRealStatus(sock, { image: buf, caption: finalCaption })
      return reply('✅ Image status posted!')
    }

    // ── VIDEO ───────────────────────────────────────────────
    if (/video/i.test(mtype)) {
      await reply('⏳ Posting video status...')

      const buf = await downloadMedia(quotedMsg, 'video')
      if (!buf) return reply('❌ Could not download video.')

      const quotedCaption = quotedMsg.videoMessage?.caption || ''
      const finalCaption = userText || quotedCaption || DEFAULT_CAPTION

      await sendRealStatus(sock, { video: buf, caption: finalCaption })
      return reply('✅ Video status posted!')
    }

    // ── AUDIO / VOICE ───────────────────────────────────────
    if (/audio/i.test(mtype)) {
      await reply('⏳ Posting voice status...')

      let buf = await downloadMedia(quotedMsg, 'audio')
      let vn = buf
      try { vn = await toVN(buf) } catch (e) { console.error('toVN failed:', e) }

      let waveform
      try { waveform = await generateWaveform(buf) } catch (e) { console.error('waveform failed:', e) }

      await sendRealStatus(sock, {
        audio: vn,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        waveform,
      })
      return reply('✅ Voice status posted!')
    }

    // ── STICKER ─────────────────────────────────────────────
    if (/sticker/i.test(mtype)) {
      await reply('⏳ Posting sticker status...')

      const buf = await downloadMedia(quotedMsg, 'sticker')
      if (!buf) return reply('❌ Could not download sticker.')

      await sendRealStatus(sock, { image: buf })
      return reply('✅ Sticker status posted!')
    }

    return reply('❌ Unsupported media type. Reply to an image, video, audio, or sticker.')
  } catch (e) {
    console.error('tostatus error:', e)
    return reply('❌ Error: ' + (e.message || e))
  }
}

// ==================== REAL STATUS POSTING ====================
async function sendRealStatus(sock, content) {
  const { backgroundColor } = content
  delete content.backgroundColor

  await sock.sendMessage(STATUS_JID, content, {
    statusJidList: [],        // Public to all contacts
    broadcast: true
  })
}

// ==================== HELPERS ====================
async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg
  const stream = await downloadContentFromMessage(mediaMsg, type)
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
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
        if (sampleCount <= 0) return resolve(undefined)

        const amplitudes = []
        for (let i = 0; i < sampleCount; i++) {
          const offset = i * 2
          amplitudes.push(Math.abs(raw.readInt16LE(offset)) / 32768)
        }

        const size = Math.floor(amplitudes.length / bars)
        if (size <= 0) return resolve(undefined)

        const barsData = Array.from({ length: bars }, (_, i) => {
          const slice = amplitudes.slice(i * size, (i + 1) * size)
          if (!slice.length) return 0
          return slice.reduce((a, b) => a + b, 0) / slice.length
        })

        const max = Math.max(...barsData)
        if (!max) return resolve(undefined)

        const normalized = barsData.map(v => Math.max(0, Math.min(100, Math.floor((v / max) * 100))))
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