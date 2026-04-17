// ============================================================
//  VANGUARD MD — commands/rate.js
// ============================================================

const { randInt } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, args } = ctx

  if (!args.length) {
    return reply('❌ What should I rate?\n_Example: .rate pizza_')
  }

  const thing = args.join(' ')
  const score = randInt(1, 10)

  let emoji   = ''
  let verdict = ''

  if (score === 10)     { emoji = '🏆'; verdict = 'Absolutely legendary!' }
  else if (score >= 8)  { emoji = '🔥'; verdict = 'Really impressive!' }
  else if (score >= 6)  { emoji = '😊'; verdict = 'Pretty good actually!' }
  else if (score >= 4)  { emoji = '😐'; verdict = 'Could be better...' }
  else if (score >= 2)  { emoji = '😬'; verdict = 'Not great honestly.' }
  else                  { emoji = '💀'; verdict = 'Absolutely terrible!' }

  const bar = '█'.repeat(score) + '░'.repeat(10 - score)

  await reply(
    '╭───────────────━⊷\n' +
    '┃ ⭐ *RATING*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📝 *Thing:* ' + thing + '\n' +
    '┃\n' +
    '┃ ' + emoji + ' *Score:* ' + score + '/10\n' +
    '┃ [' + bar + ']\n' +
    '┃\n' +
    '┃ 💬 _' + verdict + '_\n' +
    '╰───────────────━⊷'
  )
}
