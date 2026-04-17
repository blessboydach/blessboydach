// ============================================================
//  VANGUARD MD — commands/rob.js
// ============================================================

const { getBalance, getEconomy, saveEconomy, jidToNum, randInt } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

const robCooldowns = new Map()
const ROB_COOLDOWN = 30 * 60 * 1000

module.exports = async (ctx) => {
  const { reply, sender, mentions, quoted } = ctx
  const senderNum = jidToNum(sender)

  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  if (!target) return reply('❌ Mention or reply to someone to rob!\n_Example: .rob @user_')
  if (target === sender) return reply('❌ You cannot rob yourself!')

  const targetNum = jidToNum(target)

  const coolKey = senderNum + ':rob'
  const lastRob = robCooldowns.get(coolKey) || 0
  const now     = Date.now()

  if (now - lastRob < ROB_COOLDOWN) {
    const remaining = ROB_COOLDOWN - (now - lastRob)
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    return reply('⏳ *Lay Low!*\nPolice are watching! Try again in *' + mins + 'm ' + secs + 's*')
  }

  const robberAccount = getBalance(senderNum)
  const victimAccount = getBalance(targetNum)

  if (victimAccount.balance < 100) {
    return reply({
      text:     '💸 @' + targetNum + ' is *broke!* Nothing to steal here 😂',
      mentions: [target],
    })
  }

  const successChance = config.robSuccessChance || defaults.robSuccessChance
  const success       = Math.random() < successChance
  const data          = getEconomy()
  robCooldowns.set(coolKey, now)

  if (success) {
    const percent   = randInt(10, 40) / 100
    const stolen    = Math.floor(victimAccount.balance * percent)
    const newBal    = robberAccount.balance + stolen
    const victimBal = victimAccount.balance - stolen

    data[senderNum] = data[senderNum] || {}
    data[targetNum] = data[targetNum] || {}
    data[senderNum].balance = newBal
    data[targetNum].balance = victimBal
    saveEconomy(data)

    await reply({
      text:
        '╭───────────────━⊷\n' +
        '┃ 🦹 *ROBBERY SUCCESS!*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ 😈 @' + senderNum + ' robbed @' + targetNum + '!\n' +
        '┃\n' +
        '┃ 💰 *Stolen:* $' + stolen.toLocaleString() + '\n' +
        '┃ 💵 *Your Balance:* $' + newBal.toLocaleString() + '\n' +
        '┃ 😢 *Victim Left:* $' + victimBal.toLocaleString() + '\n' +
        '┃\n' +
        '┃ 🚨 Make a run for it!\n' +
        '╰───────────────━⊷',
      mentions: [sender, target],
    })

  } else {
    const fine    = Math.floor(robberAccount.balance * (randInt(10, 20) / 100))
    const newBal  = Math.max(0, robberAccount.balance - fine)

    data[senderNum] = data[senderNum] || {}
    data[senderNum].balance = newBal
    saveEconomy(data)

    await reply({
      text:
        '╭───────────────━⊷\n' +
        '┃ 🚨 *ROBBERY FAILED!*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ 👮 @' + senderNum + ' got caught trying to rob @' + targetNum + '!\n' +
        '┃\n' +
        '┃ 💸 *Fine Paid:* -$' + fine.toLocaleString() + '\n' +
        '┃ 💵 *Your Balance:* $' + newBal.toLocaleString() + '\n' +
        '┃\n' +
        '┃ 😂 Better luck next time!\n' +
        '╰───────────────━⊷',
      mentions: [sender, target],
    })
  }
}
