// ============================================================
//  VANGUARD MD — commands/unarchive.js
//  Chat Unarchiving Utility (owner and sudo)
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, isOwner, isSudo } = ctx

  // Security Check
  if (!isOwner && !isSudo) {
    return reply('❌ *Access Denied:* This command is restricted to the VANGUARD MD owner.')
  }

  await reply('📂 *Processing unarchive request...*')

  try {
    // Execute Baileys Chat Modification
    await sock.chatModify(
      {
        archive: false,
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
      `╭───────────────━⊷\n` +
      `┃ 📂 *CHAT UNARCHIVED*\n` +
      `╰───────────────━⊷\n` +
      `┃ The current chat has been\n` +
      `┃ restored to the main inbox.\n` +
      `╰───────────────━⊷\n` +
      `> _VANGUARD MD Security_`

    await reply(output)

  } catch (error) {
    console.error('[UNARCHIVE] Error:', error.message)
    await reply(`❌ *System Error:* Failed to unarchive chat. (${error.message})`)
  }
}
