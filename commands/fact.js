// ============================================================
//  VANGUARD MD — commands/fact.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const facts = readData('facts.json')
  if (!facts.length) return reply('❌ No facts found!')
  const { fact } = randItem(facts)
  await reply(`🧠 *Random Fact*\n\n${fact}`)
}
