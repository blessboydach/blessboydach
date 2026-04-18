// ============================================================
//  VANGUARD MD — commands/broadcast.js
//  Media + Text Broadcast to ALL groups (Inbox only)
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { isSudo } = require('../lib/utils')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

module.exports = async (ctx) => {
  const { sock, jid, msg, quoted, args, reply, fromGroup } = ctx

  // Permission
  if (!isSudo) return reply('❌ *Access Denied:* Only Sudo/Owner can use this command.')

  // Must be used in inbox only
  if (fromGroup) {
    return reply('❌ This command can only be used in **private chat** with the bot (inbox).')
  }

  let caption = args.join(' ').trim()

  if (!quoted) {
    return reply('❌ Reply to a media message or type text after .broadcast')
  }

  // Determine media type and download buffer
  const quotedMsg = quoted.message
  let mediaType = null
  let buffer = null
  let isSticker = false

  if (quotedMsg.imageMessage) {
    mediaType = 'image'
    buffer = await downloadContentFromMessage(quotedMsg.imageMessage, 'image')
  } 
  else if (quotedMsg.videoMessage) {
    mediaType = 'video'
    buffer = await downloadContentFromMessage(quotedMsg.videoMessage, 'video')
  } 
  else if (quotedMsg.audioMessage) {
    mediaType = 'audio'
    buffer = await downloadContentFromMessage(quotedMsg.audioMessage, 'audio')
  } 
  else if (quotedMsg.stickerMessage) {
    mediaType = 'sticker'
    buffer = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker')
    isSticker = true
  } 
  else {
    return reply('❌ Reply to an image, video, audio, or sticker!')
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return reply(`❌ Media is too big!\nMaximum allowed size is 5MB.`)
  }

  // Caption priority
  if (!caption) {
    // Use caption from quoted media if available
    if (quotedMsg.imageMessage?.caption) caption = quotedMsg.imageMessage.caption
    else if (quotedMsg.videoMessage?.caption) caption = quotedMsg.videoMessage.caption
    else if (quotedMsg.audioMessage?.caption) caption = quotedMsg.audioMessage.caption
    else caption = '> Vanguard MD is on Fire 🔥'
  }

  // Fetch all groups
  let groups = {}
  try {
    groups = await sock.groupFetchAllParticipating()
  } catch (err) {
    return reply('❌ Failed to fetch group list.')
  }

  const groupList = Object.entries(groups)
  if (groupList.length === 0) {
    return reply('😶 Bot is not in any groups.')
  }

  const progressMsg = await reply(`📢 Found *${groupList.length}* groups.\nStarting broadcast...`)

  let sent = 0
  let failed = 0

  for (let i = 0; i < groupList.length; i++) {
    const [groupJid] = groupList[i]

    try {
      const options = { quoted: msg }

      if (mediaType === 'image') {
        await sock.sendMessage(groupJid, { image: buffer, caption }, options)
      } 
      else if (mediaType === 'video') {
        await sock.sendMessage(groupJid, { video: buffer, caption, mimetype: 'video/mp4' }, options)
      } 
      else if (mediaType === 'audio') {
        await sock.sendMessage(groupJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: false }, options)
      } 
      else if (isSticker) {
        await sock.sendMessage(groupJid, { sticker: buffer }, options)
      }

      sent++
    } catch (err) {
      failed++
      console.error(`Broadcast failed to ${groupJid}:`, err.message)
    }

    // Progress update every 10 groups
    if ((i + 1) % 10 === 0 || i === groupList.length - 1) {
      const percent = Math.round(((i + 1) / groupList.length) * 100)
      await sock.sendMessage(jid, {
        text: `📤 Broadcasting...\nProgress: ${percent}%\nSent: ${sent} | Failed: ${failed}`,
        edit: progressMsg.key
      })
    }

    // Small delay to avoid rate limit
    await new Promise(r => setTimeout(r, 800))
  }

  // Final Report
  await sock.sendMessage(jid, {
    text: `✅ *Broadcast Completed*\n\n` +
          `📊 Total Groups : ${groupList.length}\n` +
          `📤 Sent        : ${sent}\n` +
          `❌ Failed      : ${failed}`,
    edit: progressMsg.key
  })
}
