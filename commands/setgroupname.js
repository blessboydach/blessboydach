// ============================================================
//  VANGUARD MD — commands/setgroupname.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // ── Admins + sudo can use ─────────────────────────────────
  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to change the group name!')

  const newName = args.join(' ').trim()
  if (!newName)              return reply('❌ Provide a new group name!\n_Example: .setgroupname My Group_')
  if (newName.length > 100)  return reply('❌ Group name too long! Maximum 100 characters.')

  try {
    await sock.groupUpdateSubject(jid, newName)
    await reply('✅ _Mission Completed Successfully_')
  } catch (err) {
    await reply('❌ Failed to change group name: ' + err.message)
  }
}
