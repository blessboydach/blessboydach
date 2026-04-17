// ============================================================
//  VANGUARD MD — commands/daily.js
// ============================================================

const { getBalance, setBalance, getEconomy, saveEconomy, jidToNum } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, sender } = ctx
  const senderNum = jidToNum(sender)

  const data     = getEconomy()
  const account  = getBalance(senderNum)
  const now      = Date.now()
  const cooldown = 24 * 60 * 60 * 1000

  if (account.lastDaily) {
    const elapsed = now - account.lastDaily
    if (elapsed < cooldown) {
      const remaining = cooldown - elapsed
      const hrs  = Math.floor(remaining / 3600000)
      const mins = Math.floor((remaining % 3600000) / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      return reply(
        '🎁 *DAILY REWARD*\n' +
        '⏳ *Already Claimed!*\n' +
        '⏰ Come back in: *' + hrs + 'h ' + mins + 'm ' + secs + 's*\n' +
        ''
      )
    }
  }

  const reward     = config.dailyReward || defaults.dailyReward
  const newBalance = account.balance + reward

  if (!data[senderNum]) data[senderNum] = {}
  data[senderNum].balance   = newBalance
  data[senderNum].lastDaily = now
  saveEconomy(data)

  await reply({
    text:
      '🎁 *DAILY REWARD*\n' +
      '👤 @' + senderNum + '\n' +
      '✅ *Claimed:* +$' + reward.toLocaleString() + '\n' +
      '💵 *New Balance:* $' + newBalance.toLocaleString() + '\n' +
      '⏰ Come back in *24 hours* for more!\n' +
      '',
    mentions: [sender],
  })
}
