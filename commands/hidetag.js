// ============================================================
//  VANGUARD MD — commands/hidetag.js
// ============================================================

module.exports = async (ctx) => {
  const { sock, msg, jid, fromGroup, args, isSudo, quoted } = ctx

  if (!fromGroup) return async function() {
    await sock.sendMessage(jid, { text: '❌ This command can only be used in groups!' }, { quoted: msg })
  }()
  if (!isSudo) return async function() {
    await sock.sendMessage(jid, { text: '❌ Only sudo/owner can use this command!' }, { quoted: msg })
  }()

  try {
    const meta     = await sock.groupMetadata(jid)
    const mentions = meta.participants.map(p => p.id)

    // ── Priority 1: text provided in args ────────────────────
    const argText = args.join(' ').trim()
    if (argText) {
      await sock.sendMessage(jid, {
        text: argText,
        mentions,
      }, { quoted: msg })
      return
    }

    // ── Priority 2: quoted text message ──────────────────────
    if (quoted?.message) {
      const quotedText =
        quoted.message.conversation ||
        quoted.message.extendedTextMessage?.text ||
        null

      if (quotedText) {
        await sock.sendMessage(jid, {
          text: quotedText,
          mentions,
        }, { quoted: msg })
        return
      }
    }

    // ── Fallback: no text anywhere ────────────────────────────
    await sock.sendMessage(jid, {
      text: 'No provided Text',
      mentions,
    }, { quoted: msg })

  } catch (err) {
    await sock.sendMessage(jid, {
      text: '❌ Failed to send hidetag: ' + err.message,
    }, { quoted: msg })
  }
}
