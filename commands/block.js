// ============================================================
//  VANGUARD MD — commands/block.js
// ============================================================

const { jidToNum } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, sock, jid, mentions, quoted, isOwner, isSudo, fromGroup } = ctx
  if (!isOwner && !isSudo) return reply('❌ Only owner and sudo users can use this command!')

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention or reply to someone to block!\n_Example: .block @user_')

  const targetNum = jidToNum(target)

  try {
    await sock.updateBlockStatus(target, 'block')

    const successText =
      '🚫 *USER BLOCKED*\n' +
      '👤 @' + targetNum + ' has been blocked\n' +
      ''

    // ── If blocked from a DM send confirmation to owner inbox
    if (!fromGroup) {
      const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
      await sock.sendMessage(ownerJid, {
        text:     successText,
        mentions: [target],
      })
    } else {
      await reply({
        text:     successText,
        mentions: [target],
      })
    }
  } catch (err) {
    await reply('❌ Failed to block: ' + err.message)
  }
}
