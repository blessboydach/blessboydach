// ============================================================
//  VANGUARD MD — commands/toviewonce.js
//  Convert media to view-once with smart deletion
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const downloadVO = async (mediaMessage, type) => {
  const stream = await downloadContentFromMessage(mediaMessage, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

module.exports = async (ctx) => {
  const { sock, jid, msg, quoted, fromGroup, sender, isSudo } = ctx

  // Reactions
  const react = (emoji) => sock.sendMessage(jid, {
    react: { text: emoji, key: msg.key }
  })

  if (!quoted) {
    await react('❌')
    return sock.sendMessage(jid, {
      text: '❌ Reply to a view-once message (image/video/audio)!'
    }, { quoted: msg })
  }

  try {
    // Extract the real media inside view-once
    const quotedMsg = quoted.message
    const innerMsg = (
      quotedMsg?.viewOnceMessage?.message ||
      quotedMsg?.viewOnceMessageV2?.message ||
      quotedMsg?.viewOnceMessageV2Extension?.message ||
      quotedMsg
    )

    const quotedImage = innerMsg?.imageMessage
    const quotedVideo = innerMsg?.videoMessage
    const quotedAudio = innerMsg?.audioMessage

    if (!quotedImage && !quotedVideo && !quotedAudio) {
      await react('❌')
      return sock.sendMessage(jid, {
        text: '❌ Reply to a view-once media message!'
      }, { quoted: msg })
    }

    // ── Permission to delete ───────────────────────────────────
    const isOwnMessage = quoted.key?.fromMe === true
    let canDelete = isOwnMessage

    if (fromGroup && !isOwnMessage) {
      try {
        const groupMeta = await sock.groupMetadata(jid)
        const participant = groupMeta.participants.find(p => p.id === sender)
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
        canDelete = isAdmin
      } catch {
        canDelete = false
      }
    }

    // ── Download and send as view-once ────────────────────────
    let sent = false

    if (quotedImage) {
      const buffer = await downloadVO(quotedImage, 'image')
      await sock.sendMessage(jid, {
        image: buffer,
        caption: quotedImage.caption || '',
        viewOnce: true
      }, { quoted: msg })
      sent = true
    }
    else if (quotedVideo) {
      const buffer = await downloadVO(quotedVideo, 'video')
      await sock.sendMessage(jid, {
        video: buffer,
        caption: quotedVideo.caption || '',
        viewOnce: true
      }, { quoted: msg })
      sent = true
    }
    else if (quotedAudio) {
      const buffer = await downloadVO(quotedAudio, 'audio')
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: quotedAudio.mimetype || 'audio/ogg; codecs=opus',
        ptt: quotedAudio.ptt || false,
        viewOnce: true
      }, { quoted: msg })
      sent = true
    }

    if (!sent) {
      await react('❌')
      return sock.sendMessage(jid, { text: '❌ Could not extract media!' }, { quoted: msg })
    }

    // ── Delete original only if permitted ─────────────────────
    if (canDelete) {
      try {
        await sock.sendMessage(jid, { delete: quoted.key })
        await react('✅')           // Success + deleted
      } catch (_) {
        await react('✅')           // Still success even if delete failed
      }
    } else {
      await react('❎')             // No permission to delete
    }

  } catch (err) {
    await react('❌')
    await sock.sendMessage(jid, {
      text: '❌ Failed: ' + err.message
    }, { quoted: msg })
  }
}