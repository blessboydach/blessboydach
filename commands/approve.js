// ============================================================
//  VANGUARD MD — commands/approve.js
// ============================================================

const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { sock, jid, reply, args, fromGroup, isSudo, sender } = ctx

  if (!fromGroup) return reply('❌ Groups only!')

  const botAdmin    = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ _Bot must be admin!_')

  const senderAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderAdmin) return reply('❌ _Admins only!_')

  const command = ctx.command

  try {
    // ── Fetch pending requests ────────────────────────────────
    const pending = await sock.groupRequestParticipantsList(jid)

    if (!pending || !pending.length) {
      return reply('ℹ️ _No pending join requests!_')
    }

    if (command === 'approveall') {
      // ── Approve all ───────────────────────────────────────
      const jids = pending.map(p => p.jid)
      await sock.groupRequestParticipantsUpdate(jid, jids, 'approve')
      return reply('✅ _Approved *' + jids.length + '* pending requests!_')
    }

    // ── Approve N ─────────────────────────────────────────────
    const count = parseInt(args[0])
    if (!args[0] || isNaN(count) || count < 1) {
      return reply(
        '✅ *APPROVE*\n' +
        '📊 *Pending:* ' + pending.length + ' requests\n' +
        '*Usage:*\n' +
        '.approve 5 — approve 5\n' +
        '.approveall — approve all\n' +
        ''
      )
    }

    const toApprove = pending.slice(0, count).map(p => p.jid)
    await sock.groupRequestParticipantsUpdate(jid, toApprove, 'approve')
    await reply(
      '✅ _Approved *' + toApprove.length + '/' + pending.length + '* requests!_'
    )

  } catch (err) {
    await reply('❌ _Failed: ' + err.message + '_')
  }
}
