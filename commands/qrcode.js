// ============================================================
//  VANGUARD MD — commands/qrcode.js
// ============================================================

const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, args } = ctx

  if (!args.length) {
    return reply('❌ Provide text to generate QR code!\n_Example: .qrcode Hello World_')
  }

  const text = args.join(' ')

  if (text.length > 500) {
    return reply('❌ Text too long! Maximum 500 characters.')
  }

  await reply('⏳ *Generating QR code...*')

  try {
    const outputPath = path.join(tmpdir(), `vanguard_qr_${Date.now()}.png`)

    await QRCode.toFile(outputPath, text, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    const buffer = fs.readFileSync(outputPath)

    await sock.sendMessage(jid, {
      image: buffer,
      caption: `✅ *QR Code Generated!*\n📝 Content: _${text.length > 50 ? text.slice(0, 50) + '...' : text}_`,
      mimetype: 'image/png',
    }, { quoted: msg })

    fs.unlinkSync(outputPath)

  } catch (err) {
    await reply(`❌ Failed to generate QR code: ${err.message}`)
  }
}
