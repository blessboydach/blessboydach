// ============================================================
//  VANGUARD MD — commands/archive.js
//  Chat Archiving Utility (owner and sudo)
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, isOwner, isSudo } = ctx

  // Security Check: Ensure only you (the developer/owner) can trigger this
  if (!isOwner && !isSudo) {
    return reply('❌ *Access Denied:* This command is restricted to the VANGUARD MD owner.')
  }

  await reply('📦 *Processing archive request...*')

  try {
    // Execute Baileys Chat Modification
    await sock.chatModify(
      {
        archive: true,
        lastMessages: [
          {
            key: msg.key,
            messageTimestamp: msg.messageTimestamp
          }
        ]
      },
      jid
    )

    const output = 
      `\n` +
      `📦 *CHAT ARCHIVED*\n` +
      `\n` +
      `The current chat has been\n` +
      `moved to your archives.\n` +
      `\n` +
      `> _VANGUARD MD Security_`

    await reply(output)

  } catch (error) {
    console.error('[ARCHIVE] Error:', error.message)
    await reply(`❌ *System Error:* Failed to archive chat. (${error.message})`)
  }
}
