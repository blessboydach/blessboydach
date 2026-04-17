// ============================================================
//  VANGUARD MD — commands/quote.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const quotes = readData('quotes.json')
  if (!quotes.length) return reply('❌ No quotes found!')
  const { quote, author } = randItem(quotes)
  await reply(`💬 *Quote*\n\n_"${quote}"_\n\n— *${author}*`)
}
