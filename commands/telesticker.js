// ============================================================
//  VANGUARD MD - commands/telesticker.js
//  Telegram Sticker Pack Downloader
// ============================================================

const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')
const { exec } = require('child_process')
const { tmpdir } = require('os')
const webp = require('node-webpmux')
const config = require('../config')
const defaults = require('../defaults')

const BOT_TOKEN = '7801479976:AAGuPLa7kXXBYz6XUSR_ll2SR5V_W6oHl4'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// Fetch JSON from URL
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// Fetch binary buffer from URL
const fetchBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

// Convert to webp via ffmpeg
const toWebp = (inputPath, outputPath, isAnimated) => {
  return new Promise((resolve, reject) => {
    const vf = isAnimated
      ? 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'
      : 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'

    const cmd =
      'ffmpeg -y -i "' + inputPath + '" -vf "' + vf +
      '" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "' +
      outputPath + '"'

    exec(cmd, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// Inject EXIF metadata into webp
const injectExif = async (webpBuffer, emoji, packname, author) => {
  const tmpIn = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp')
  const tmpOut = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp')

  fs.writeFileSync(tmpIn, webpBuffer)

  const img = new webp.Image()
  const json = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': packname || config.packname || defaults.packname || 'VANGUARD MD',
    'sticker-pack-publisher': author || config.author || defaults.author || 'Admin',
    'emojis': [emoji || '🤖']
  }

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuf])
  exif.writeUIntLE(jsonBuf.length, 14, 4)

  await img.load(tmpIn)
  img.exif = exif
  await img.save(tmpOut)

  const result = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch (e) {}
  try { fs.unlinkSync(tmpOut) } catch (e) {}
  return result
}

// Main command
module.exports = async (ctx) => {
  const { reply, args, sock, jid } = ctx

  if (!args[0]) {
    return reply(
      '╭───────────────━⊷\n' +
      '┃ 📦 *TELEGRAM STICKERS*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ Usage: .telesticker <sticker pack URL>\n' +
      '┃\n' +
      '┃ Example:\n' +
      '┃ .telesticker https://t.me/addstickers/PackName\n' +
      '╰───────────────━⊷'
    )
  }

  const url = args[0].trim()

  if (!url.match(/https:\/\/t\.me\/addstickers\//i)) {
    return reply('❌ Invalid URL!\n_Must be a Telegram sticker URL._\n_Example: https://t.me/addstickers/PackName_')
  }

  const packName = url.replace('https://t.me/addstickers/', '').split('/')[0].trim()

  await reply('⏳ *Fetching sticker pack…*')

  // Get pack info
  let stickerSet
  try {
    const res = await fetchJson(
      'https://api.telegram.org/bot' + BOT_TOKEN +
      '/getStickerSet?name=' + encodeURIComponent(packName)
    )
    if (!res.ok || !res.result) throw new Error('Pack not found')
    stickerSet = res.result
  } catch (e) {
    return reply('❌ Could not fetch sticker pack.\n_Check the URL and make sure the pack is public._')
  }

  const stickers = stickerSet.stickers
  await reply(
    '╭───────────────━⊷\n' +
    '┃ 📦 *' + (stickerSet.title || packName) + '*\n' +
    '┃ 🎯 ' + stickers.length + ' stickers found\n' +
    '┃ ⏳ Sending now…\n' +
    '╰───────────────━⊷'
  )

  // Ensure tmp dir
  const tmpDir = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  let success = 0

  for (let i = 0; i < stickers.length; i++) {
    const sticker = stickers[i]

    try {
      // Get file path from Telegram
      const fileInfo = await fetchJson(
        'https://api.telegram.org/bot' + BOT_TOKEN +
        '/getFile?file_id=' + sticker.file_id
      )
      if (!fileInfo.ok || !fileInfo.result || !fileInfo.result.file_path) continue

      // Download raw sticker bytes
      const fileUrl = 'https://api.telegram.org/file/bot' + BOT_TOKEN + '/' + fileInfo.result.file_path
      const rawBuffer = await fetchBuffer(fileUrl)

      const isAnimated = sticker.is_animated || sticker.is_video
      const rand = crypto.randomBytes(6).toString('hex')
      const tmpIn = path.join(tmpDir, 'tg_in_' + rand)
      const tmpOut = path.join(tmpDir, 'tg_out_' + rand + '.webp')

      fs.writeFileSync(tmpIn, rawBuffer)

      // Convert to webp
      await toWebp(tmpIn, tmpOut, isAnimated)

      const webpBuffer = fs.readFileSync(tmpOut)

      // Inject EXIF
      const finalBuffer = await injectExif(
        webpBuffer,
        sticker.emoji || '🤖',
        stickerSet.title || packName,
        'VANGUARD MD'
      )

      // Send sticker
      await sock.sendMessage(jid, { sticker: finalBuffer })
      success++

      // Cleanup
      try { fs.unlinkSync(tmpIn) } catch (e) {}
      try { fs.unlinkSync(tmpOut) } catch (e) {}

      await delay(800)
    } catch (e) {
      continue
    }
  }

  await reply(
    '╭───────────────━⊷\n' +
    '┃ ✅ *DONE!*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📦 Sent: *' + success + '/' + stickers.length + '*\n' +
    '╰───────────────━⊷'
  )
}
