// ============================================================
//  VANGUARD MD - commands/resetlink.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, sender, fromGroup, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  const senderAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to reset the group link!')

  try {
    const newCode = await sock.groupRevokeInvite(jid)
    await reply(
      '╭───────────────━⊷\n' +
      '┃ 🔗 *LINK RESET*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ ✅ Group link successfully reset!\n' +
      '┃\n' +
      '┃ 📌 *New Link:*\n' +
      '┃ https://chat.whatsapp.com/' + newCode + '\n' +
      '╰───────────────━⊷'
    )
  } catch (e) {
    await reply('❌ Failed to reset group link!\n_' + e.message + '_')
  }
}
