// ============================================================
//  VANGUARD MD — commands/poll.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, args, body, prefix } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // Parse: .poll Question | Option1 | Option2 | Option3
  const fullText = body.slice(prefix.length + 5).trim() // remove ".poll "
  const parts = fullText.split('|').map(p => p.trim()).filter(Boolean)

  if (parts.length < 3) {
    return reply(`❌ Usage: *.poll Question | Option1 | Option2 | ...*\n_Example: .poll Best fruit? | Mango | Apple | Banana_`)
  }

  const question = parts[0]
  const options = parts.slice(1)

  if (options.length < 2) {
    return reply('❌ Provide at least *2 options* for the poll!')
  }

  if (options.length > 12) {
    return reply('❌ Maximum *12 options* allowed!')
  }

  try {
    await sock.sendMessage(jid, {
      poll: {
        name: question,
        values: options,
        selectableCount: 1,
      }
    })
  } catch (err) {
    await reply(`❌ Failed to create poll: ${err.message}`)
  }
}
