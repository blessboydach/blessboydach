// ============================================================
//  VANGUARD MD — commands/leaderboard.js
// ============================================================

const { getEconomy } = require('../lib/utils')

const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

module.exports = async (ctx) => {
  const { reply } = ctx

  const data = getEconomy()

  if (!data || Object.keys(data).length === 0) {
    return reply('❌ No economy data yet! Start with *.daily* or *.work*')
  }

  const sorted = Object.entries(data)
    .map(([num, acc]) => ({ num, balance: acc.balance || 0 }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)

  const rows = sorted
    .map((entry, i) => '' + medals[i] + ' *+' + entry.num + '* — 💵 $' + entry.balance.toLocaleString())
    .join('\n')

  await reply(
    '🏆 *ECONOMY LEADERBOARD*\n' +
    rows + '\n' +
    '💡 Earn more with *.daily* and *.work*\n' +
    ''
  )
}
