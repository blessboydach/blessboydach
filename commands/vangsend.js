// ============================================================
// VANGUARD MD — commands/vangsend.js
// Text Spammer: Send repeated messages to groups
// ============================================================

module.exports = async (ctx) => {
  const { sock, jid, msg, quoted, isSudo, args } = ctx

  // ── SUDO ONLY ─────────────────────────────────────────────
  if (!isSudo) {
    return sock.sendMessage(jid, {
      text: '❌ Only owner/sudo can use this command!'
    }, { quoted: msg })
  }

  try {
    let content = args.join(' ').trim()
    let count = 3
    let groupId = null
    let textToSend = null

    // ── CHECK FOR QUOTED MESSAGE ──────────────────────────
    if (quoted?.message) {
      const quotedMsg = quoted.message

      const mediaTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'stickerMessage',
        'documentMessage'
      ]

      const quotedType = Object.keys(quotedMsg)[0]

      if (mediaTypes.includes(quotedType)) {
        return sock.sendMessage(jid, {
          text: '❌ Media and stickers are not allowed!\nOnly text messages can be spammed.'
        }, { quoted: msg })
      }

      textToSend =
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text ||
        quotedMsg.text ||
        null

      if (!textToSend) {
        return sock.sendMessage(jid, {
          text: '❌ Quoted message has no text content!'
        }, { quoted: msg })
      }

      if (args.length > 0) {
        const num = parseInt(args[0])
        if (!isNaN(num) && num > 0 && num <= 100) {
          count = num
          args.shift()
          content = args.join(' ').trim()
        }
      }
    } else {
      if (args.length > 0) {
        const num = parseInt(args[0])
        if (!isNaN(num) && num > 0 && num <= 100) {
          count = num
          args.shift()
          content = args.join(' ').trim()
        }
      }
    }

    // ── EXTRACT GROUP ─────────────────────────────────────
    const jidMatch = content.match(/\d+@g\.us/)
    if (jidMatch) {
      groupId = jidMatch[0]
      content = content.replace(groupId, '').trim()
    }

    const inviteMatch = content.match(/chat\.whatsapp\.com\/([\w\d]+)/)
    if (inviteMatch) {
      try {
        const inviteCode = inviteMatch[1]
        groupId = await sock.groupAcceptInvite(inviteCode)
        content = content.replace(inviteMatch[0], '').trim()
      } catch {
        return sock.sendMessage(jid, {
          text: '❌ Invalid or expired group link!'
        }, { quoted: msg })
      }
    }

    if (!groupId) {
      return sock.sendMessage(jid, {
        text: `❌ Provide a group link or group JID!

Usage:
.vangsend <number> <link> <message>
.vangsend <link> <message>
.vangsend <link>

Reply usage:
[Reply] .vangsend <number> <link>
[Reply] .vangsend <link>

Limits:
• Max 100 messages
• Text only`
      }, { quoted: msg })
    }

    // ── FINAL TEXT ────────────────────────────────────────
    if (!textToSend) {
      textToSend = content.length > 0
        ? content
        : '🗿 Vanguard MD check'
    }

    // ── VALIDATE COUNT ────────────────────────────────────
    if (count > 100) {
      return sock.sendMessage(jid, {
        text: '❌ Maximum 100 messages allowed!'
      }, { quoted: msg })
    }

    if (count < 1) {
      return sock.sendMessage(jid, {
        text: '❌ Count must be at least 1!'
      }, { quoted: msg })
    }

    // ── START SENDING ─────────────────────────────────────
    await sock.sendMessage(jid, {
      text: `⏳ Sending ${count} message(s)...\n📝 "${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}"`
    }, { quoted: msg })

    let sent = 0
    let failed = 0

    for (let i = 0; i < count; i++) {
      try {
        await sock.sendMessage(groupId, { text: textToSend })
        sent++
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.error(`[VANGSEND] Failed on message ${i + 1}:`, err.message)
        failed++

        if (failed >= 5) {
          return sock.sendMessage(jid, {
            text: `⚠️ Stopped early!\n✅ Sent: ${sent}\n❌ Failed: ${failed}`
          }, { quoted: msg })
        }
      }
    }

    await sock.sendMessage(jid, {
      text: `✅ Done!\n📊 Sent: ${sent}/${count}${failed > 0 ? `\n❌ Failed: ${failed}` : ''}`
    }, { quoted: msg })

  } catch (err) {
    console.error('[VANGSEND ERROR]', err)
    await sock.sendMessage(jid, {
      text: '❌ Failed!\n\nError: ' + err.message
    }, { quoted: msg })
  }
}
