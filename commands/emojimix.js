// ============================================================
//  VANGUARD MD — commands/emojimix.js
//  Mixes two emojis using Google Emoji Kitchen → sticker
// ============================================================

const axios  = require('axios')
const fs     = require('fs')
const path   = require('path')
const { exec }   = require('child_process')
const { tmpdir } = require('os')

const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'

module.exports = async (ctx) => {
  const { sock, msg, jid, args, reply } = ctx

  const input = args.join(' ').trim()

  if (!input) return reply(
    '🎴 *EMOJIMIX*\n' +
    '_Usage: .emojimix 😎+🥰_\n' +
    '_Separate emojis with a + sign_\n' +
    ''
  )

  if (!input.includes('+')) return reply(
    '🎴 *EMOJIMIX*\n' +
    '✳️ Separate emojis with a *+* sign\n' +
    '_Example: .emojimix 😎+🥰_\n' +
    ''
  )

  const [emoji1, emoji2] = input.split('+').map(e => e.trim())

  if (!emoji1 || !emoji2) return reply(
    '🎴 *EMOJIMIX*\n' +
    '❌ Please provide two emojis!\n' +
    '_Example: .emojimix 😎+🥰_\n' +
    ''
  )

  const ts       = Date.now()
  const pngPath  = path.join(tmpdir(), `vanguard_emojimix_${ts}.png`)
  const webpPath = path.join(tmpdir(), `vanguard_emojimix_${ts}.webp`)

  try {
    const { data } = await axios.get(
      `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}` +
      `&contentfilter=high&media_filter=png_transparent` +
      `&component=proactive&collection=emoji_kitchen_v5` +
      `&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`,
      { timeout: 15000 }
    )

    if (!data.results?.length) {
      return reply('❌ These emojis cannot be mixed! Try different ones. 🎴')
    }

    const imageUrl = data.results[0].url

    const { data: imgData } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    })
    fs.writeFileSync(pngPath, Buffer.from(imgData))

    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${pngPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" "${webpPath}"`,
        (err) => err ? reject(err) : resolve()
      )
    })

    const stickerBuffer = fs.readFileSync(webpPath)

    await sock.sendMessage(jid, {
      sticker: stickerBuffer,
    }, { quoted: msg })

  } catch (err) {
    await reply(
      '🎴 *EMOJIMIX*\n' +
      '❌ Failed to mix emojis!\n' +
      '_Make sure you are using valid emojis_\n' +
      '_Example: .emojimix 😎+🥰_\n' +
      ''
    )
  } finally {
    try { fs.unlinkSync(pngPath)  } catch (_) {}
    try { fs.unlinkSync(webpPath) } catch (_) {}
  }
}
