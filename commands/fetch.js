// ============================================================
//  VANGUARD MD — commands/fetch.js
//  Resend status in current chat
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
  const { reply, sock, jid, quoted, command, isSudo } = ctx

  if (!isSudo) return reply('❌ Only owner/sudo can use this command!')

  if (!quoted) {
    return reply(
      command === 'fetch2'
        ? '❌ Reply to a status to fetch it to inbox!\n_Usage: .fetch2 (reply to status)_'
        : '❌ Reply to a status to fetch it!\n_Usage: .fetch (reply to status)_'
    )
  }

  const quotedMsg = quoted.message
  if (!quotedMsg) return reply('❌ Could not read the replied message!')

  const imageMsg = quotedMsg.imageMessage
  const videoMsg = quotedMsg.videoMessage
  const textMsg  = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text

  const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
  const sendTo   = command === 'fetch2' ? ownerJid : jid

  await reply('⏳ *Fetching status...*')

  try {
    if (imageMsg) {
      const buffer = await downloadMedia(imageMsg, 'image')

      if (command === 'fetch2') {
        await sock.sendMessage(sendTo, {
          text:
            '📌 *STATUS FETCHED*\n' +
            '👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            ''
        })
      }

      await sock.sendMessage(sendTo, {
        image:    buffer,
        caption:  (imageMsg.caption ? imageMsg.caption + '\n' : '') + '> *Vanguard is on Fire* 🔥',
        mimetype: 'image/jpeg',
      })

      if (command === 'fetch2') await reply('✅ *Status fetched to owner inbox!*')

    } else if (videoMsg) {
      const buffer = await downloadMedia(videoMsg, 'video')

      if (command === 'fetch2') {
        await sock.sendMessage(sendTo, {
          text:
            '📌 *STATUS FETCHED*\n' +
            '👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            ''
        })
      }

      await sock.sendMessage(sendTo, {
        video:    buffer,
        caption:  (videoMsg.caption ? videoMsg.caption + '\n' : '') + '> *Vanguard is on Fire* 🔥',
        mimetype: 'video/mp4',
      })

      if (command === 'fetch2') await reply('✅ *Status fetched to owner inbox!*')

    } else if (textMsg) {
      if (command === 'fetch2') {
        await sock.sendMessage(sendTo, {
          text:
            '📌 *STATUS FETCHED*\n' +
            '👤 *From:* +' + quoted.sender?.split('@')[0] + '\n' +
            '' + textMsg + '\n' +
            '> *Vanguard is on Fire* 🔥'
        })
        await reply('✅ *Status fetched to owner inbox!*')
      } else {
        await sock.sendMessage(jid, {
          text: textMsg + '\n> *Vanguard is on Fire* 🔥'
        })
      }

    } else {
      await reply('❌ Unsupported status type! Only image, video and text statuses are supported.')
    }

  } catch (err) {
    await reply('❌ Failed to fetch status: ' + err.message)
  }
}
