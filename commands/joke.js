// ============================================================
//  VANGUARD MD — commands/joke.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const jokes = readData('jokes.json')
  if (!jokes.length) return reply('❌ No jokes found!')
  const { joke } = randItem(jokes)
  await reply(`😂 *Joke of the moment*\n\n${joke}`)
}
