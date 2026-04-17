// ============================================================
//  VANGUARD MD — commands/save.js
//  .save  — resend status in current chat
//  .save2 — forward status to owner inbox
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const config   = require('../config')
const defaults = require('../defaults')

const downloadMedia = async (mediaMessage, type) => {
  const stream = await downloadContentFromMessage(mediaMessage, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, quoted, command, isSudo } = ctx

  if (!isSudo) return reply('❌ Only owner/sudo can use this command!')

  if (!quoted) {
    return reply(
      command === 'save2'
        ? '❌ Reply to a status to forward it to inbox!\n_Usage: .save2 (reply to status)_'
        : '❌ Reply to a status to save it!\n_Usage: .save (reply to status)_'
    )
  }

  const quotedMsg = quoted.message
  if (!quotedMsg) return reply('❌ Could not read the replied message!')

  const imageMsg = quotedMsg.imageMessage
  const videoMsg = quotedMsg.videoMessage
  const textMsg  = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text

  const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
  const sendTo   = command === 'save2' ? ownerJid : jid

  await reply('⏳ *Saving status...*')

  try {
    if (imageMsg) {
      const buffer = await downloadMedia(imageMsg, 'image')

      if (command === 'save2') {
        await sock.sendMessage(sendTo, {
          text:
            '╭───────────────━⊷\n' +
            '┃ 📌 *STATUS SAVED*\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ 👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            '╰───────────────━⊷'
        })
      }

      await sock.sendMessage(sendTo, {
        image:    buffer,
        caption:  (imageMsg.caption ? imageMsg.caption + '\n' : '') + '> *Vanguard is on Fire* 🔥',
        mimetype: 'image/jpeg',
      })

      if (command === 'save2') await reply('✅ *Status forwarded to owner inbox!*')

    } else if (videoMsg) {
      const buffer = await downloadMedia(videoMsg, 'video')

      if (command === 'save2') {
        await sock.sendMessage(sendTo, {
          text:
            '╭───────────────━⊷\n' +
            '┃ 📌 *STATUS SAVED*\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ 👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            '╰───────────────━⊷'
        })
      }

      await sock.sendMessage(sendTo, {
        video:    buffer,
        caption:  (videoMsg.caption ? videoMsg.caption + '\n' : '') + '> *Vanguard is on Fire* 🔥',
        mimetype: 'video/mp4',
      })

      if (command === 'save2') await reply('✅ *Status forwarded to owner inbox!*')

    } else if (textMsg) {
      if (command === 'save2') {
        await sock.sendMessage(sendTo, {
          text:
            '╭───────────────━⊷\n' +
            '┃ 📌 *STATUS SAVED*\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ 👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            '┃\n' +
            '┃ ' + textMsg + '\n' +
            '╰───────────────━⊷\n' +
            '> *Vanguard is on Fire* 🔥'
        })
        await reply('✅ *Status forwarded to owner inbox!*')
      } else {
        await sock.sendMessage(jid, {
          text: textMsg + '\n> *Vanguard is on Fire* 🔥'
        })
      }

    } else {
      await reply('❌ Unsupported status type! Only image, video and text statuses are supported.')
    }

  } catch (err) {
    await reply('❌ Failed to save status: ' + err.message)
  }
}
