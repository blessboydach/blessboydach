// ============================================================
//  VANGUARD MD — commands/warn.js
// ============================================================

const { isBotAdmin, isSenderAdmin, getWarnCount, setWarnCount, jidToNum } = require('../lib/utils')

const MAX_WARNS = 3

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, mentions, quoted, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // ── Admins + sudo can use ─────────────────────────────────
  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to warn members!')

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention or reply to someone to warn!\n_Example: .warn @user_')

  if (target === sender) return reply('❌ You cannot warn yourself!')

  const targetNum = jidToNum(target)
  const reason    = args.join(' ').replace(/@\d+/g, '').trim() || 'No reason provided'
  const current   = getWarnCount(jid, targetNum)
  const newCount  = current + 1
  setWarnCount(jid, targetNum, newCount)

  if (newCount >= MAX_WARNS) {
    setWarnCount(jid, targetNum, 0)
    try { await sock.groupParticipantsUpdate(jid, [target], 'remove') } catch (_) {}

    return reply({
      text:
        '🚨 @' + targetNum + ' kicked after *' + MAX_WARNS + ' warnings*\n' +
        '📝 _' + reason + '_',
      mentions: [target],
    })
  }

  await reply({
    text:
      '⚠️ *Warning ' + newCount + '/' + MAX_WARNS + '* — @' + targetNum + '\n' +
      '📝 _' + reason + '_\n' +
      (newCount === MAX_WARNS - 1 ? '🚨 _One more warning = kick!_' : ''),
    mentions: [target],
  })
}
