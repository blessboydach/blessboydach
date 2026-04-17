// ============================================================
//  VANGUARD MD — commands/link.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // ── Admins + sudo can use ─────────────────────────────────
  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin)  return reply('❌ I need to be an admin to get the invite link!')

  try {
    const code = await sock.groupInviteCode(jid)
    const link = 'https://chat.whatsapp.com/' + code
    const meta = await sock.groupMetadata(jid)

    await reply(
      '🔗 *GROUP INVITE LINK*\n' +
      '📛 *Group:* ' + meta.subject + '\n' +
      '🔗 ' + link + '\n' +
      '⚠️ _Share carefully — anyone with this link can join!_\n' +
      ''
    )
  } catch (err) {
    await reply('❌ Failed to get invite link: ' + err.message)
  }
}
