// ============================================================
//  VANGUARD MD — commands/broadcast.js
//  Full Media + Text Broadcast (Inbox Only)
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

module.exports = async (ctx) => {
  const { sock, jid, msg, quoted, args, reply, fromGroup, isOwner, isSudo } = ctx

  // ── Permission Check (Same as your .mode command) ─────────────────
  if (!isOwner && !isSudo) {
    return reply('❌ Only Owner & Sudo can use this command!')
  }

  // ── Must be used in Inbox only ───────────────────────────────────
  if (fromGroup) {
    return reply('❌ This command can only be used in **private chat** (inbox) with the bot.')
  }

  let caption = args.join(' ').trim()

  if (!quoted) {
    return reply('❌ Reply to any media (image/video/audio/sticker) or type text after .broadcast')
  }

  // ── Extract Media ───────────────────────────────────────────────
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

  // Size check
  if (buffer.length > MAX_FILE_SIZE) {
    return reply('❌ Media is too big! Maximum allowed is 5MB.')
  }

  // Caption priority
  if (!caption) {
    caption = quotedMsg.imageMessage?.caption ||
              quotedMsg.videoMessage?.caption ||
              quotedMsg.audioMessage?.caption ||
              '> Vanguard MD is on Fire 🔥'
  }

  // ── Fetch all groups ─────────────────────────────────────────────
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
      if (mediaType === 'image') {
        await sock.sendMessage(groupJid, { image: buffer, caption })
      } 
      else if (mediaType === 'video') {
        await sock.sendMessage(groupJid, { video: buffer, caption, mimetype: 'video/mp4' })
      } 
      else if (mediaType === 'audio') {
        await sock.sendMessage(groupJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus' })
      } 
      else if (isSticker) {
        await sock.sendMessage(groupJid, { sticker: buffer })
      }

      sent++
    } catch (err) {
      failed++
      console.error(`Broadcast failed to ${groupJid}:`, err.message)
    }

    // Progress update
    if ((i + 1) % 8 === 0 || i === groupList.length - 1) {
      const percent = Math.round(((i + 1) / groupList.length) * 100)
      await sock.sendMessage(jid, {
        text: `📤 Broadcasting...\nProgress: ${percent}%\nSent: ${sent} | Failed: ${failed}`,
        edit: progressMsg.key
      })
    }

    await new Promise(r => setTimeout(r, 900)) // safe delay
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
