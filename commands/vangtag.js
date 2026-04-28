
// ============================================================
// VANGUARD MD — commands/vangtag.js
// MegaTag: Send messages/media to groups with mentions
// ============================================================

const { jidNormalizedUser, downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, jid, msg, sender, quoted, isSudo, args, fromGroup } = ctx

  // ── SUDO ONLY ─────────────────────────────────────────────
  if (!isSudo) {
    return sock.sendMessage(jid, {
      text: '❌ Only owner/sudo can use this command!'
    }, { quoted: msg })
  }

  // ── DM ONLY ───────────────────────────────────────────────
  if (fromGroup) {
    return sock.sendMessage(jid, {
      text: '❌ Use this command in bot DM only 🙏'
    }, { quoted: msg })
  }

  try {
    let content = args.join(' ').trim()

    // ── EXTRACT GROUP JID OR LINK ─────────────────────────
    let groupId = null

    // Check for direct JID
    const jidMatch = content.match(/\d+@g\.us/)
    if (jidMatch) {
      groupId = jidMatch[0]
      content = content.replace(groupId, '').trim()
    }

    // Check for invite link
    const inviteMatch = content.match(/chat\.whatsapp\.com\/([\w\d]+)/)
    if (inviteMatch) {
      try {
        const inviteCode = inviteMatch[1]
        groupId = await sock.groupAcceptInvite(inviteCode)
        content = content.replace(inviteMatch[0], '').trim()
      } catch (err) {
        return sock.sendMessage(jid, {
          text: '❌ Invalid or expired group link!'
        }, { quoted: msg })
      }
    }

    if (!groupId) {
      return sock.sendMessage(jid, {
        text: '❌ Provide a group link or group JID!\n\n*Usage:*\n`.vangtag [group link/jid] [message]`\n\n*Examples:*\n`.vangtag https://chat.whatsapp.com/xxxxx Hello everyone!`\n`.vangtag 123456@g.us Check this out`\n\n*With numbers:*\n`.vangtag [link] +256745626308 +254110442027 Special mention!`\n\n*Reply to media:*\nReply to an image/video/sticker and use `.vangtag [link]` to send it to the group'
      }, { quoted: msg })
    } // <- Only ONE bracket here. You had 2 before

    // ── DETECT PHONE NUMBERS ──────────────────────────────
    const numberRegex = /\+?\d[\d\s]{7,18}\d/g
    const foundNumbers = content.match(numberRegex) || []
    let finalText = content
    let numbers = []

    for (let rawNum of foundNumbers) {
      const cleanNum = rawNum.replace(/\D/g, '')
      if (cleanNum.length < 9 || cleanNum.length > 15) continue
      numbers.push(cleanNum)
      finalText = finalText.replace(rawNum, `@${cleanNum}`)
    }

    numbers = [...new Set(numbers)]
    const targetJids = numbers.map(num => jidNormalizedUser(num + '@s.whatsapp.net'))

    // ── FETCH GROUP PARTICIPANTS ──────────────────────────
    const groupMeta = await sock.groupMetadata(groupId)
    const participants = groupMeta.participants.map(p => p.id)
    const allMentions = [...participants,...targetJids]

    // ── CHECK FOR REPLIED MEDIA ───────────────────────────
    if (quoted?.message) {
      const quotedMsg = quoted.message
      
      const typeMap = {
        stickerMessage: 'sticker',
        imageMessage: 'image',
        videoMessage: 'video',
        audioMessage: 'audio',
        documentMessage: 'document'
      }

      const msgType = Object.keys(quotedMsg)[0]
      const sendType = typeMap[msgType]

      if (sendType && quotedMsg[msgType]) {
        const mediaMsg = quotedMsg[msgType]

        // Download media
        try {
          const stream = await downloadContentFromMessage(mediaMsg, sendType === 'sticker'? 'sticker' : sendType)
          const chunks = []
          for await (const chunk of stream) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)

          // Send media to group with hidetag
          await sock.sendMessage(groupId, {
            [sendType]: buffer,
            caption: mediaMsg.caption || '',
            mentions: allMentions
          })

          // Send text if provided
          if (finalText) {
            await sock.sendMessage(groupId, {
              text: finalText,
              mentions: allMentions
            })
          }

          await sock.sendMessage(jid, {
            text: `✅ Media + text sent to group!\n👥 Tagged: ${participants.length} group members${numbers.length > 0? ` + ${numbers.length} numbers` : ''}`
          }, { quoted: msg })

          return

        } catch (err) {
          return sock.sendMessage(jid, {
            text: '❌ Failed to download media: ' + err.message
          }, { quoted: msg })
        }
      }
    }

    // ── SEND TEXT-ONLY VAMGTAG ────────────────────────────
    await sock.sendMessage(groupId, {
      text: finalText || '‎', // invisible char if empty
      mentions: allMentions
    })

    await sock.sendMessage(jid, {
      text: `✅ Vangtag sent!\n👥 Tagged: ${participants.length} group members${numbers.length > 0? `\n📞 Special mentions: ${numbers.length} number(s)` : ''}`
    }, { quoted: msg })

  } catch (err) {
    console.error('[VANGTAG ERROR]', err)
    await sock.sendMessage(jid, {
      text: '❌ Failed to send megatag!\n\n*Error:* ' + err.message
    }, { quoted: msg })
  }
}
