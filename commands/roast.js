// ============================================================
//  VANGUARD MD — commands/roast.js
// ============================================================

const { readData, randItem, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, mentions, quoted, sender } = ctx

  // Get target from mention or quoted
  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) {
    return reply('❌ Please mention or reply to someone to roast!\n_Example: .roast @user_')
  }

  const roasts = readData('roasts.json')
  if (!roasts.length) return reply('❌ No roasts found!')

  const roast = randItem(roasts)
  const targetNum = jidToNum(target)
  const senderNum = jidToNum(sender)

  await reply({
    text: `🔥 *ROAST*\n\n@${senderNum} roasts @${targetNum}:\n\n_${roast}_`,
    mentions: [target, sender],
  })
}
