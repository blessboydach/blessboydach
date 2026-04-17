// ============================================================
//  VANGUARD MD — commands/totalmembers.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  try {
    const meta       = await sock.groupMetadata(jid)
    const all        = meta.participants
    const admins     = all.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    const superAdmins = all.filter(p => p.admin === 'superadmin')
    const regular    = all.filter(p => !p.admin)

    await reply(
      '╭───────────────━⊷\n' +
      '┃ 👥 *GROUP MEMBERS*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 📛 *Group:* ' + meta.subject + '\n' +
      '┃\n' +
      '┃ 👤 *Total Members:* ' + all.length + '\n' +
      '┃ 👑 *Super Admins:* ' + superAdmins.length + '\n' +
      '┃ ⭐ *Admins:* ' + admins.length + '\n' +
      '┃ 🙋 *Regular:* ' + regular.length + '\n' +
      '╰───────────────━⊷'
    )
  } catch (err) {
    await reply('❌ Failed to fetch group info: ' + err.message)
  }
}
