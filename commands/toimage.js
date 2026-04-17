// ============================================================
//  VANGUARD MD — commands/toimage.js
//  Converts STATIC stickers only → jpg image
// ============================================================

const fs   = require('fs')
const path = require('path')
const { tmpdir } = require('os')
const sharp = require('sharp')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, reply } = ctx

  const target  = quoted || msg
  const msgType = Object.keys(target.message || {})[0]

  if (msgType !== 'stickerMessage') {
    return reply('❌ Please reply to a *sticker* to convert!\n_Usage: .toimage (reply to static sticker)_')
  }

  const isAnimated = target.message.stickerMessage?.isAnimated

  if (isAnimated) {
    return reply('❌ This is an *animated sticker*!\n_Use *.tovideo* to convert animated stickers._')
  }

  await reply('⏳ *Converting sticker to image...*')

  const ts         = Date.now()
  const inputPath  = path.join(tmpdir(), `vanguard_sticker_${ts}.webp`)
  const outputPath = path.join(tmpdir(), `vanguard_image_${ts}.jpg`)

  try {
    // ── Download using correct sticker stream method ──────────
    const stream = await downloadContentFromMessage(
      target.message.stickerMessage,
      'sticker'
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

    fs.writeFileSync(inputPath, buffer)

    // ── sharp reads webp natively — no FFmpeg needed 🗿 ───────
    await sharp(inputPath)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(outputPath)

    const imageBuffer = fs.readFileSync(outputPath)

    await sock.sendMessage(jid, {
      image:    imageBuffer,
      mimetype: 'image/jpeg',
      caption:  '🖼️ *Sticker converted to image*',
    }, { quoted: msg })

  } catch (err) {
    await reply(`❌ Failed to convert sticker: ${err.message}`)
  } finally {
    for (const f of [inputPath, outputPath]) {
      try { fs.unlinkSync(f) } catch (_) {}
    }
  }
}
