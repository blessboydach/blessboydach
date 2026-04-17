// ============================================================
// VANGUARD MD — commands/members.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, msg } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  try {
    const meta = await sock.groupMetadata(jid)
    const all = meta.participants
    const mentions = all.map(p => p.id) // <-- add this

    const list = all.map((p, i) => {
      const num = p.id.split('@')[0]
      const role = p.admin === 'superadmin'? '👑' : p.admin === 'admin'? '⭐' : '👤'
      return '' + role + ' ' + (i + 1) + '. @' + num // use @ not +
    }).join('\n')

    const text =
      '👥 *MEMBERS LIST*\n' +
      '📛 *Group:* ' + meta.subject + '\n' +
      '👤 *Total:* ' + all.length + '\n' +
      list + '\n' +
      '👑 Owner ⭐ Admin 👤 Member\n' +
      ''

    await sock.sendMessage(jid, { text, mentions }, { quoted: msg }) // send mentions
  } catch (err) {
    await reply('❌ Failed to fetch members: ' + err.message)
  }
}
