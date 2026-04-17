// ============================================================
//  VANGUARD MD — commands/work.js
// ============================================================

const { getBalance, getEconomy, saveEconomy, jidToNum, randInt, randItem } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

const jobs = [
  'delivered packages 📦',
  'fixed computers 💻',
  'drove a taxi 🚕',
  'cooked at a restaurant 🍳',
  'taught students 📚',
  'sold vegetables at the market 🥦',
  'worked as a security guard 🛡️',
  'washed cars 🚗',
  'designed a website 🌐',
  'repaired phones 📱',
  'did graphic design 🎨',
  'wrote articles for a blog ✍️',
  'worked as a DJ 🎧',
  'cut hair at a barbershop 💈',
  'fixed motorbikes 🏍️',
]

module.exports = async (ctx) => {
  const { reply, sender } = ctx
  const senderNum = jidToNum(sender)

  const data     = getEconomy()
  const account  = getBalance(senderNum)
  const now      = Date.now()
  const cooldown = 60 * 60 * 1000

  if (account.lastWork) {
    const elapsed = now - account.lastWork
    if (elapsed < cooldown) {
      const remaining = cooldown - elapsed
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      return reply(
        '╭───────────────━⊷\n' +
        '┃ 💼 *WORK*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ ⏳ *Already Worked Recently!*\n' +
        '┃ 😴 Come back in: *' + mins + 'm ' + secs + 's*\n' +
        '╰───────────────━⊷'
      )
    }
  }

  const minReward  = config.workMinReward || defaults.workMinReward
  const maxReward  = config.workMaxReward || defaults.workMaxReward
  const earned     = randInt(minReward, maxReward)
  const job        = randItem(jobs)
  const newBalance = account.balance + earned

  if (!data[senderNum]) data[senderNum] = {}
  data[senderNum].balance  = newBalance
  data[senderNum].lastWork = now
  saveEconomy(data)

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ 💼 *WORK*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 👤 @' + senderNum + ' ' + job + '\n' +
      '┃\n' +
      '┃ 💵 *Earned:* +$' + earned.toLocaleString() + '\n' +
      '┃ 🏦 *Balance:* $' + newBalance.toLocaleString() + '\n' +
      '┃\n' +
      '┃ ⏰ Work again in *1 hour*\n' +
      '╰───────────────━⊷',
    mentions: [sender],
  })
}
