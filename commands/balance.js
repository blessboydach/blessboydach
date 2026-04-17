// ============================================================
//  VANGUARD MD — commands/balance.js
// ============================================================

const { getBalance, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sender, mentions, quoted } = ctx

  let target    = sender
  let targetNum = jidToNum(sender)
  let isSelf    = true

  if (mentions?.[0]) {
    target    = mentions[0]
    targetNum = jidToNum(target)
    isSelf    = false
  } else if (quoted?.sender) {
    target    = quoted.sender
    targetNum = jidToNum(target)
    isSelf    = false
  }

  const account = getBalance(targetNum)

  await reply({
    text:
      '💰 *BALANCE*\n' +
      '👤 *User:* @' + targetNum + '\n' +
      '💵 *Balance:* $' + account.balance.toLocaleString() + '\n' +
      (isSelf ? '💡 Earn more with *.daily* and *.work*\n' : '') +
      '',
    mentions: [target],
  })
}
