// ============================================================
//  VANGUARD MD — commands/groupinfo.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  try {
    const meta    = await sock.groupMetadata(jid)
    const all     = meta.participants
    const admins  = all.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    const owner   = all.find(p => p.admin === 'superadmin')
    const created = meta.creation
      ? new Date(meta.creation * 1000).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
      : 'Unknown'

    await reply(
      '👥 *GROUP INFO*\n' +
      '📛 *Name:* ' + meta.subject + '\n' +
      '🆔 *JID:* ' + jid + '\n' +
      '📝 *Description:*\n' +
      '_' + (meta.desc || 'No description set') + '_\n' +
      '👑 *Owner:* +' + (owner ? owner.id.split('@')[0] : 'Unknown') + '\n' +
      '📅 *Created:* ' + created + '\n' +
      '👤 *Total Members:* ' + all.length + '\n' +
      '⭐ *Admins:* ' + admins.length + '\n' +
      '🙋 *Regular:* ' + (all.length - admins.length) + '\n' +
      '🔒 *Announce:* ' + (meta.announce ? 'Yes (Admin only)' : 'No') + '\n' +
      '🔗 *Restrict:* ' + (meta.restrict ? 'Yes' : 'No') + '\n' +
      ''
    )
  } catch (err) {
    await reply('❌ Failed to fetch group info: ' + err.message)
  }
}
