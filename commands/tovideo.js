// ============================================================
//  VANGUARD MD — commands/tovideo.js
//  Converts ANIMATED stickers only → mp4 video
//  Strategy: sharp extracts frames → ffmpeg assembles mp4
// ============================================================

const fs     = require('fs')
const path   = require('path')
const { exec } = require('child_process')
const { tmpdir } = require('os')
const sharp  = require('sharp')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, reply } = ctx

  const target  = quoted || msg
  const msgType = Object.keys(target.message || {})[0]

  if (msgType !== 'stickerMessage') {
    return reply('❌ Please reply to a *sticker* to convert!\n_Usage: .tovideo (reply to animated sticker)_')
  }

  const isAnimated = target.message.stickerMessage?.isAnimated

  if (!isAnimated) {
    return reply('❌ This is a *static sticker*!\n_Use *.toimage* to convert static stickers._')
  }

  await reply('⏳ *Converting animated sticker to video...*')

  const ts         = Date.now()
  const inputPath  = path.join(tmpdir(), `vanguard_sticker_${ts}.webp`)
  const framesDir  = path.join(tmpdir(), `vanguard_frames_${ts}`)
  const outputPath = path.join(tmpdir(), `vanguard_video_${ts}.mp4`)

  try {
    // ── Download using correct sticker stream method ──────────
    const stream = await downloadContentFromMessage(
      target.message.stickerMessage,
      'sticker'
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

    fs.writeFileSync(inputPath, buffer)
    fs.mkdirSync(framesDir, { recursive: true })

    // ── sharp reads animated webp natively 🗿 ─────────────────
    const metadata = await sharp(inputPath, { animated: true }).metadata()
    const frameCount = metadata.pages || 1
    const frameDelay = metadata.delay?.[0] || 100  // ms per frame
    const fps = Math.round(1000 / frameDelay) || 10

    // ── Extract each frame as jpg ─────────────────────────────
    for (let i = 0; i < frameCount; i++) {
      const framePath = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.jpg`)
      await sharp(inputPath, { animated: false, page: i })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
        .jpeg({ quality: 90 })
        .toFile(framePath)
    }

    // ── ffmpeg assembles frames → mp4 ────────────────────────
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame_%04d.jpg" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -preset fast -crf 28 "${outputPath}"`,
        (err) => err ? reject(err) : resolve()
      )
    })

    const videoBuffer = fs.readFileSync(outputPath)

    await sock.sendMessage(jid, {
      video:    videoBuffer,
      mimetype: 'video/mp4',
      caption:  '🎬 *Animated sticker converted to video*',
    }, { quoted: msg })

  } catch (err) {
    await reply(`❌ Failed to convert sticker: ${err.message}`)
  } finally {
    try { fs.unlinkSync(inputPath) } catch (_) {}
    try { fs.unlinkSync(outputPath) } catch (_) {}
    try {
      if (fs.existsSync(framesDir)) {
        fs.readdirSync(framesDir).forEach(f => {
          try { fs.unlinkSync(path.join(framesDir, f)) } catch (_) {}
        })
        fs.rmdirSync(framesDir)
      }
    } catch (_) {}
  }
}
