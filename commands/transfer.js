// ============================================================
//  VANGUARD MD — commands/transfer.js
// ============================================================

const { getBalance, getEconomy, saveEconomy, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sender, mentions, quoted, args } = ctx
  const senderNum = jidToNum(sender)

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention someone to transfer to!\n_Example: .transfer @user 500_')
  if (target === sender) return reply('❌ You cannot transfer to yourself!')

  const amount = parseInt(args[args.length - 1])
  if (isNaN(amount) || amount <= 0) return reply('❌ Provide a valid amount!\n_Example: .transfer @user 500_')
  if (amount < 10) return reply('❌ Minimum transfer amount is *$10*')

  const targetNum     = jidToNum(target)
  const senderAccount = getBalance(senderNum)
  const targetAccount = getBalance(targetNum)

  if (senderAccount.balance < amount) {
    return reply(
      '❌ Insufficient balance!\n' +
      '💵 Your balance: *$' + senderAccount.balance.toLocaleString() + '*\n' +
      '💸 Needed: *$' + amount.toLocaleString() + '*'
    )
  }

  const data = getEconomy()
  data[senderNum] = data[senderNum] || {}
  data[targetNum] = data[targetNum] || {}
  data[senderNum].balance = senderAccount.balance - amount
  data[targetNum].balance = targetAccount.balance + amount
  saveEconomy(data)

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ 💸 *TRANSFER SUCCESS*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 📤 *From:* @' + senderNum + '\n' +
      '┃ 📥 *To:* @' + targetNum + '\n' +
      '┃\n' +
      '┃ 💵 *Amount:* $' + amount.toLocaleString() + '\n' +
      '┃ 🏦 *Your New Balance:* $' + (senderAccount.balance - amount).toLocaleString() + '\n' +
      '┃\n' +
      '┃ ✅ Transfer completed!\n' +
      '╰───────────────━⊷',
    mentions: [sender, target],
  })
}
