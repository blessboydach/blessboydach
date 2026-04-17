// ============================================================
//  VANGUARD MD — commands/vv.js
//  .vv  — reveal view-once in same chat
//  .vv2 — forward view-once to owner inbox (silent)
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { jidToNum } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

const downloadVO = async (mediaMessage, type) => {
  const stream = await downloadContentFromMessage(mediaMessage, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, quoted, command, isSudo, sender } = ctx

  if (!isSudo) return reply('❌ Only owner/sudo can use this command!')

  if (!quoted) {
    return reply(
      command === 'vv2'
        ? '❌ Reply to a view-once message!\nUsage: .vv2 (reply to view-once)'
        : '❌ Reply to a view-once message!\nUsage: .vv (reply to view-once)'
    )
  }

  const quotedMsg = quoted.message
  const innerMsg  = (
    quotedMsg?.viewOnceMessage?.message ||
    quotedMsg?.viewOnceMessageV2?.message ||
    quotedMsg?.viewOnceMessageV2Extension?.message ||
    quotedMsg
  )

  const quotedImage = innerMsg?.imageMessage
  const quotedVideo = innerMsg?.videoMessage

  const isVO = (
    quotedMsg?.viewOnceMessage ||
    quotedMsg?.viewOnceMessageV2 ||
    quotedMsg?.viewOnceMessageV2Extension ||
    quotedImage?.viewOnce ||
    quotedVideo?.viewOnce
  )

  if (!isVO) return reply('❌ The replied message is not a view-once message!')

  if (command === 'vv') await reply('⏳ Revealing view-once...')

  const sendTo = command === 'vv2'
    ? (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
    : jid

  try {
    if (quotedImage) {
      const buffer = await downloadVO(quotedImage, 'image')

      if (command === 'vv2') {
        await sock.sendMessage(sendTo, {
          text:
            'VIEW ONCE FORWARDED\n' +
            'From: +' + jidToNum(sender) + '\n' +
            'Chat: ' + jid
        })
      }

      await sock.sendMessage(sendTo, {
        image: buffer,
        caption: (quotedImage.caption ? quotedImage.caption + '\n' : '') + 'Vanguard is on Fire 🔥',
        mimetype: 'image/jpeg',
      }, { quoted: command === 'vv' ? msg : undefined })

    } else if (quotedVideo) {
      const buffer = await downloadVO(quotedVideo, 'video')

      if (command === 'vv2') {
        await sock.sendMessage(sendTo, {
          text:
            'VIEW ONCE FORWARDED\n' +
            'From: +' + jidToNum(sender) + '\n' +
            'Chat: ' + jid
        })
      }

      await sock.sendMessage(sendTo, {
        video: buffer,
        caption: (quotedVideo.caption ? quotedVideo.caption + '\n' : '') + 'Vanguard is on Fire 🔥',
        mimetype: 'video/mp4',
      }, { quoted: command === 'vv' ? msg : undefined })

    } else {
      await reply('❌ Could not extract media from view-once message!')
    }

  } catch (err) {
    await reply('❌ Failed to reveal: ' + err.message)
  }
}
