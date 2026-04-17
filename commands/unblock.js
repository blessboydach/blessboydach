// ============================================================
//  VANGUARD MD — commands/unblock.js
// ============================================================

const { jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, mentions, quoted, isOwner, isSudo } = ctx
  if (!isOwner && !isSudo) return reply('❌ Only owner and sudo users can use this command!')

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention or reply to someone to unblock!\n_Example: .unblock @user_')

  const targetNum = jidToNum(target)

  try {
    // ── Check if actually blocked ─────────────────────────
    const privacy = await sock.fetchBlocklist()
    const isBlocked = privacy.some(jid =>
      jid.replace(/:[0-9]+@/, '@') === target.replace(/:[0-9]+@/, '@')
    )

    if (!isBlocked) {
      return reply({
        text:     '❎ _@' + targetNum + ' is already not blocked_',
        mentions: [target],
      })
    }

    await sock.updateBlockStatus(target, 'unblock')

    await reply({
      text:

        
        

        
        ' 👤 @' + targetNum + ' has been unblocked\n' +
        '',
      mentions: [target],
    })
  } catch (err) {
    await reply('❌ Failed to unblock: ' + err.message)
  }
}
