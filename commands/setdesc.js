// ============================================================
//  VANGUARD MD — commands/setdesc.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // ── Admins + sudo can use ─────────────────────────────────
  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to change the group description!')

  const newDesc = args.join(' ').trim()
  if (!newDesc)              return reply('❌ Provide a new description!\n_Example: .setdesc Welcome to our group!_')
  if (newDesc.length > 500)  return reply('❌ Description too long! Maximum 500 characters.')

  try {
    await sock.groupUpdateDescription(jid, newDesc)
    await reply('✅ _Mission Completed Successfully_')
  } catch (err) {
    await reply('❌ Failed to update description: ' + err.message)
  }
}
