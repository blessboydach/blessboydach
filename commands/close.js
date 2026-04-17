// ============================================================
//  VANGUARD MD — commands/close.js
// ============================================================
module.exports = async (ctx) => {
  const { sock, jid, reply, args, fromGroup, isSudo, groupSettings } = ctx

  if (!fromGroup) return reply('❌ _Command Supports Use in a group!_')

  // ── Admins can use in public mode ─────────────────────────
  const meta        = await sock.groupMetadata(jid).catch(() => null)
  const senderAdmin = meta?.participants?.find(p =>
    p.id.includes(ctx.senderNum)
  )?.admin
  if (!isSudo && !senderAdmin) return reply('❌ _For Admins only!_')

  const minutes = parseInt(args[0]) || 0

  try {
    await sock.groupSettingUpdate(jid, 'announcement')
    await reply('🔒 _Group closed' + (minutes ? ' for ' + minutes + ' min' : '') + '!_')

    if (minutes > 0) {
      setTimeout(async () => {
        try {
          await sock.groupSettingUpdate(jid, 'not_announcement')
          await sock.sendMessage(jid, { text: '🔓 _Group reopened Members Can now send messages !_' })
        } catch (_) {}
      }, minutes * 60 * 1000)
    }
  } catch (err) {
    await reply('❌ Failed: ' + err.message)
  }
}
