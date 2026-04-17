// ============================================================
//  VANGUARD MD — commands/tagall.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = async (ctx) => {
  const { sock, msg, jid, fromGroup, sender, senderNum, args, quoted, isSudo } = ctx

  if (!fromGroup) return async function() {
    await sock.sendMessage(jid, { text: '❌ This command can only be used in groups!' }, { quoted: msg })
  }()

  try {
    const meta     = await sock.groupMetadata(jid)
    const all      = meta.participants
    const mentions = all.map(p => p.id)

    // ── Resolve message ───────────────────────────────────────
    let tagMessage = null

    // Priority 1 — args text
    const argText = args.join(' ').trim()
    if (argText) {
      tagMessage = argText
    }
    // Priority 2 — quoted message
    else if (quoted?.message) {
      const q = quoted.message
      const text =
        q.conversation              ||
        q.extendedTextMessage?.text ||
        null

      if (text) {
        tagMessage = text
      } else {
        // Media — try caption
        const caption =
          q.imageMessage?.caption    ||
          q.videoMessage?.caption    ||
          q.documentMessage?.caption ||
          null
        tagMessage = caption || null
      }
    }

    // ── Build member list ─────────────────────────────────────
    const memberList = all.map((p, i) => {
      const num = p.id.split('@')[0]
      return (i + 1) + '. 🔹 @' + num
    }).join('\n')

    const text =
      '╭───────────────━⊷\n' +
      '┃ 📢 *ATTENTION EVERYONE*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 🧑‍💻 *Tagged By:* @' + senderNum + '\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 💬 *MESSAGE:* ' + (tagMessage || 'No Message Provided') + '\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      memberList + '\n' +
      '╰───────────────━⊷'

    await sock.sendMessage(jid, {
      text,
      mentions,
    }, { quoted: msg })

  } catch (err) {
    await sock.sendMessage(jid, {
      text: '❌ Failed to tag all: ' + err.message,
    }, { quoted: msg })
  }
}
