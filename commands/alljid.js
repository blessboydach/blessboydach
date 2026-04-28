// ============================================================
// VANGUARD MD — commands/alljid.js
// Lists all groups the bot is in and their JIDs
// ============================================================

module.exports = async (ctx) => {
  const { sock, jid, msg, reply, isSudo } = ctx

  // SUDO ONLY
  if (!isSudo) {
    return reply('❌ Only owner/sudo can use this command!')
  }

  try {
    const groups = await sock.groupFetchAllParticipating()
    const entries = Object.entries(groups || {})

    if (!entries.length) {
      return reply('❌ Bot is not in any groups.')
    }

    const lines = entries.map(([groupJid, meta], index) => {
      const name = meta?.subject || 'Unknown Group'
      return [
        `${index + 1}. 🍒${name}`,
        `🫐${groupJid}`
      ].join('\n')
    })

    const header = '✅Jabber IDs Scan Complete ❇️\n\n'
    const footer = '\n\n> _Vanguard MD is On Fire🔥_'

    // Keep messages safely below WhatsApp length limits
    const MAX_BODY = 3500

    const chunks = []
    let current = header

    for (const line of lines) {
      const next = current + line + '\n\n'
      if (next.length + footer.length > MAX_BODY) {
        chunks.push(current.trimEnd())
        current = header + line + '\n\n'
      } else {
        current = next
      }
    }

    chunks.push(current.trimEnd() + footer)

    // Send all chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      await sock.sendMessage(jid, {
        text: chunks[i]
      }, { quoted: msg })
    }

  } catch (err) {
    console.error('[ALLJID ERROR]', err)
    return reply('❌ Failed to fetch group list: ' + err.message)
  }
}
