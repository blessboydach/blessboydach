// ============================================================
//  VANGUARD MD — commands/calculate.js
// ============================================================

const { create, all } = require('mathjs')
const math = create(all)

module.exports = async (ctx) => {
  const { reply, args } = ctx

  if (!args.length) {
    return reply('❌ Provide a math expression!\n_Example: .calculate 25 * 4 + 10_')
  }

  const expression = args.join(' ')

  try {
    const blocked = ['import', 'require', 'process', 'eval', 'Function', '__', 'prototype']
    if (blocked.some(b => expression.includes(b))) {
      return reply('❌ Invalid expression!')
    }

    const result = math.evaluate(expression)

    await reply(
      '🧮 *CALCULATOR*\n' +
      '📝 *Expression:* ' + expression + '\n' +
      '✅ *Result:* ' + result + '\n' +
      ''
    )
  } catch (err) {
    await reply('❌ Invalid expression: _' + err.message + '_\n_Example: .calculate 25 * 4 + 10_')
  }
}
