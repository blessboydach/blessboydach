// ============================================================
//  VANGUARD MD — commands/setmenuimage.js
// ============================================================

const fs   = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys') // ← REQUIRE, not import

const IMAGE_PATH = path.join(__dirname, '..', 'assets', 'botimage.jpg')

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, isSudo, prefix } = ctx

  if (!isSudo) return ctx.reply('❌ *Owner/Sudo only!*')

  if (!quoted || !quoted.message) {
    return ctx.reply(
   
      
      ' *Reply to an image to set it as the menu image.*\n' +
      ''
    )
  }

  const qMsg       = quoted.message
  const imageMsg   = qMsg.imageMessage || qMsg.viewOnceMessage?.message?.imageMessage
  const isImage    = Boolean(imageMsg)

  if (!isImage) {
    return ctx.reply(
    
      
      
      '*Only image files are accepted.*\n' +
      ' *Videos, stickers, documents — not allowed.*\n' +
      ''
    )
  }

  let progressMsg
  try {
    progressMsg = await sock.sendMessage(jid, {
      text: 'Initialising ⏳…',
    }, { quoted: msg })
  } catch (_) {}

  try {
    // No dynamic import needed — already required at top!
    const stream = await downloadContentFromMessage(imageMsg, 'image')
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty')
    }

    const assetsDir = path.join(__dirname, '..', 'assets')
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true })
    }

    fs.writeFileSync(IMAGE_PATH, buffer)

    if (progressMsg?.key) {
      try {
        await sock.sendMessage(jid, {
          text:  '✅ *Operation successful!*\n_Menu image updated. Send_ `' +
                 (prefix || '.') + 'menu` _to preview._',
          edit:  progressMsg.key,
        })
      } catch (_) {
        await ctx.reply('✅ *Menu image updated successfully!*')
      }
    } else {
      await ctx.reply('✅ *Menu image updated successfully!*')
    }
  } catch (err) {
    if (progressMsg?.key) {
      try {
        await sock.sendMessage(jid, {
          text: '❌ *Failed:* *' + err.message + '*',
          edit: progressMsg.key,
        })
      } catch (_) {
        await ctx.reply('❌ *Failed:* *' + err.message + '*')
      }
    } else {
      await ctx.reply('❌ *Failed:* *' + err.message + '*')
    }
  }
}
