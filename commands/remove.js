// ============================================================
//  VANGUARD MD — commands/remove.js
// ============================================================

const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, mentions, quoted, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // ── Admin check — admins can use in public mode ───────────
  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to remove members!')

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention or reply to someone to remove!\n_Example: .remove @user_')

  // ── Normalize JIDs for comparison ────────────────────────
  const normalize   = (j) => (j || '').replace(/:[0-9]+@/, '@')
  const botJid      = normalize(sock.user?.id)
  const targetClean = normalize(target)
  const senderClean = normalize(sender)

  // ── Bot or self targeted — silent leave 🗿 ────────────────
  if (targetClean === botJid || targetClean === senderClean) {
    try { await sock.groupLeave(jid) } catch (_) {}
    return
  }

  // ── Check if target is creator ────────────────────────────
  try {
    const meta    = await sock.groupMetadata(jid)
    const creator = meta.participants.find(p => p.admin === 'superadmin')
    if (creator && normalize(creator.id) === targetClean) {
      return reply('❎ _Mission Failure Reason: Creator_')
    }
  } catch (_) {}

  const targetNum = jidToNum(target)

  try {
    await sock.groupParticipantsUpdate(jid, [target], 'remove')
    await reply({
      text:     '✅ _Mission Completed Successfully_',
      mentions: [target],
    })
  } catch (err) {
    await reply('❌ Failed to kick: ' + err.message)
  }
}
