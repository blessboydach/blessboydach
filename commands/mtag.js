// ============================================================
//  VANGUARD MD — commands/mtag.js
//  Media Tag (reply to media → resend + tag all)
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { getContentType } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, msg, jid, fromGroup, isSudo, quoted } = ctx

  if (!fromGroup) {
    return sock.sendMessage(jid, {
      text: '❌ This command can only be used in groups!'
    }, { quoted: msg })
  }

  if (!isSudo) {
    return sock.sendMessage(jid, {
      text: '❌ Only sudo/owner can use this command!'
    }, { quoted: msg })
  }

  try {
    if (!quoted?.message) {
      return sock.sendMessage(jid, {
        text: '❌ Reply to media (image/video/audio/sticker/gif)'
      }, { quoted: msg })
    }

    // ── GET CONTENT TYPE (CORRECT WAY) ────────────────
    const contentType = getContentType(quoted.message)
    
    if (!contentType || !/image|video|audio|sticker/i.test(contentType)) {
      return sock.sendMessage(jid, {
        text: '❌ Only media messages allowed!'
      }, { quoted: msg })
    }

    // ── DETERMINE MEDIA TYPE ──────────────────────────
    let mediaType
    if (contentType === 'imageMessage') mediaType = 'image'
    else if (contentType === 'videoMessage') mediaType = 'video'
    else if (contentType === 'audioMessage') mediaType = 'audio'
    else if (contentType === 'stickerMessage') mediaType = 'sticker'
    else {
      return sock.sendMessage(jid, {
        text: '❌ Unsupported media type!'
      }, { quoted: msg })
    }

    // ── DOWNLOAD MEDIA (CORRECT WAY) ──────────────────
    const messageContent = quoted.message[contentType]
    const stream = await downloadContentFromMessage(messageContent, mediaType)
    
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // ── GET GROUP MENTIONS ────────────────────────────
    const meta = await sock.groupMetadata(jid)
    const mentions = meta.participants.map(p => p.id)

    // ── GET ORIGINAL CAPTION ──────────────────────────
    const originalCaption = messageContent.caption || ''

    // ── BUILD MESSAGE ─────────────────────────────────
    let content = {}

    if (mediaType === 'image') {
      content = {
        image: buffer,
        caption: originalCaption || '‎',
        mentions
      }
    }
    else if (mediaType === 'video') {
      content = {
        video: buffer,
        caption: originalCaption || '‎',
        mimetype: messageContent.mimetype || 'video/mp4',
        mentions
      }
    }
    else if (mediaType === 'audio') {
      content = {
        audio: buffer,
        mimetype: messageContent.mimetype || 'audio/ogg; codecs=opus',
        ptt: messageContent.ptt || false,
        mentions
      }
    }
    else if (mediaType === 'sticker') {
      // Stickers don't support mentions, send separately
      await sock.sendMessage(jid, { sticker: buffer })
      return sock.sendMessage(jid, {
        text: mentions.map(m => `@${m.split('@')[0]}`).join(' '),
        mentions
      }, { quoted: msg })
    }

    // ── SEND ──────────────────────────────────────────
    await sock.sendMessage(jid, content, { quoted: msg })

  } catch (err) {
    await sock.sendMessage(jid, {
      text: '❌ Failed: ' + err.message
    }, { quoted: msg })
    console.error('[MTAG ERROR]', err)
  }
}