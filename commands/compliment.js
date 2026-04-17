// ============================================================
//  VANGUARD MD — commands/compliment.js
// ============================================================

const { readData, randItem, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, mentions, quoted, sender } = ctx

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) {
    return reply('❌ Please mention or reply to someone to compliment!\n_Example: .compliment @user_')
  }

  const compliments = readData('compliments.json')
  if (!compliments.length) return reply('❌ No compliments found!')

  const compliment = randItem(compliments)
  const targetNum  = jidToNum(target)
  const senderNum  = jidToNum(sender)

  await reply({
    text:
      '💙 *COMPLIMENT*\n' +
      '@' + senderNum + ' says to @' + targetNum + ':\n' +
      '_' + compliment + '_\n' +
      '',
    mentions: [target, sender],
  })
}
