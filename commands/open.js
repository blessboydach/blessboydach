// ============================================================
//  VANGUARD MD — commands/open.js
// ============================================================
module.exports = async (ctx) => {
  const { sock, jid, reply, fromGroup, isSudo } = ctx

  if (!fromGroup) return reply('❌ _Command supoorts Use in a group!_')

  const meta        = await sock.groupMetadata(jid).catch(() => null)
  const senderAdmin = meta?.participants?.find(p =>
    p.id.includes(ctx.senderNum)
  )?.admin
  if (!isSudo && !senderAdmin) return reply('❌ _Command For Admins only!_')

  try {
    await sock.groupSettingUpdate(jid, 'not_announcement')
    await reply('🔓 _Group opened Members Can now send messages !_')
  } catch (err) {
    await reply('❌ Failed: ' + err.message)
  }
}
