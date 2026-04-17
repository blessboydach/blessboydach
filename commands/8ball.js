// ============================================================
//  VANGUARD MD — commands/8ball.js
// ============================================================

const { randItem } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

const responses = [
  // Positive
  { text: 'It is certain! 🎯',          type: '✅' },
  { text: 'Without a doubt! 💯',         type: '✅' },
  { text: 'Yes, definitely! 🔥',         type: '✅' },
  { text: 'You may rely on it! 👍',      type: '✅' },
  { text: 'As I see it, yes! 👁️',       type: '✅' },
  { text: 'Most likely! 😊',             type: '✅' },
  { text: 'Outlook good! 🌟',            type: '✅' },
  { text: 'Signs point to yes! ➡️',     type: '✅' },
  // Neutral
  { text: 'Reply hazy, try again! 🌫️',  type: '⚠️' },
  { text: 'Ask again later... ⏳',       type: '⚠️' },
  { text: 'Better not tell you now! 🤫', type: '⚠️' },
  { text: 'Cannot predict now! 🔮',      type: '⚠️' },
  { text: 'Concentrate and ask again! 🧘', type: '⚠️' },
  // Negative
  { text: "Don't count on it! ❌",       type: '❌' },
  { text: 'My reply is no! 🚫',          type: '❌' },
  { text: 'My sources say no! 📉',       type: '❌' },
  { text: 'Outlook not so good! 😬',     type: '❌' },
  { text: 'Very doubtful! 🤔',           type: '❌' },
]

module.exports = async (ctx) => {
  const { reply, args } = ctx

  if (!args.length) {
    return reply('❌ Ask me a question!\n_Example: .8ball Will I be rich?_')
  }

  const botName  = config.botName || defaults.botName || 'VANGUARD MD'
  const question = args.join(' ')
  const response = randItem(responses)

  await reply(
    '🎱 *MAGIC 8 BALL*\n' +
    '❓ *Question:*\n' +
    '_' + question + '_\n' +
    '' + response.type + ' *Answer:*\n' +
    '' + response.text + '\n' +
    '\n' 
  )
}
