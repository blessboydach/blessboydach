// ============================================================
//  VANGUARD MD — commands/sticker.js
// ============================================================

const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { writeExif } = require('../lib/exif')
const config = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, reply } = ctx

  const target = quoted || msg
  const msgType = Object.keys(target.message || {})[0]
  
  const isImage = msgType === 'imageMessage'
  const isVideo = msgType === 'videoMessage'

  if (!isImage && !isVideo) {
    return reply('❌ Please reply to or send an *image* or *video* to convert to sticker!\n_Usage: .sticker (reply to image/video)_')
  }

  try {
    // 1. Download the raw media
    const mediaBuffer = await downloadMediaMessage(
      { message: target.message, key: target.key },
      'buffer',
      {},
      { logger: require('pino')({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
    )

    if (!mediaBuffer) throw new Error('Failed to download media.')

    // 2. Setup  Metadata
    const metadata = {
        packname: config.botName || defaults.botName || 'VANGUARD X',
        author: 'Blue', // 
        categories: ['🗿', '🔥']
    }

    // 3. Process through our EXIF factory
    const stickerBuffer = await writeExif(mediaBuffer, isVideo, metadata)

    // 4. Send cleanly.
    await sock.sendMessage(jid, {
      sticker: stickerBuffer
    }, { quoted: msg })

  } catch (err) {
    console.error('Sticker Error:', err)
    await reply(`❌ Failed to create sticker: ${err.message}`)
  }
}
