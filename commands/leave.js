// ============================================================
//  VANGUARD MD — commands/leave.js
// ============================================================
module.exports = async (ctx) => {
  const { sock, jid, reply, isSudo, fromGroup } = ctx
  if (!isSudo) return reply('❌ Command restricted to Owner/sudo only!')
  if (!fromGroup) return reply('❌ Command Usage in a group!')
  await reply('👋 _Good byee ,It was nice being here ..._')
  await sock.groupLeave(jid)
}
