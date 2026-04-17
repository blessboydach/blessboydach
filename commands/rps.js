// ============================================================
//  VANGUARD MD — commands/rps.js
// ============================================================

const { randItem, jidToNum } = require('../lib/utils')

const choices = ['rock', 'paper', 'scissors']
const emojis  = { rock: '🪨', paper: '📄', scissors: '✂️' }

const getResult = (player, bot) => {
  if (player === bot) return 'draw'
  if (
    (player === 'rock'     && bot === 'scissors') ||
    (player === 'paper'    && bot === 'rock')     ||
    (player === 'scissors' && bot === 'paper')
  ) return 'win'
  return 'lose'
}

module.exports = async (ctx) => {
  const { reply, args, sender } = ctx

  const playerChoice = args[0]?.toLowerCase()
  if (!playerChoice || !choices.includes(playerChoice)) {
    return reply('❌ Choose one: *rock*, *paper*, or *scissors*\n_Example: .rps rock_')
  }

  const botChoice   = randItem(choices)
  const result      = getResult(playerChoice, botChoice)
  const senderNum   = jidToNum(sender)

  let verdict     = ''
  let resultEmoji = ''

  if (result === 'win') {
    verdict     = '🎉 *You Win!* Congrats @' + senderNum + '!'
    resultEmoji = '🏆'
  } else if (result === 'lose') {
    verdict     = '😈 *Bot Wins!* Better luck next time @' + senderNum + '!'
    resultEmoji = '🤖'
  } else {
    verdict     = '🤝 *It\'s a Draw!* Try again @' + senderNum + '!'
    resultEmoji = '⚖️'
  }

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ ' + resultEmoji + ' *ROCK PAPER SCISSORS*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 👤 *You:*  ' + emojis[playerChoice] + ' ' + playerChoice.toUpperCase() + '\n' +
      '┃ 🤖 *Bot:*  ' + emojis[botChoice] + ' ' + botChoice.toUpperCase() + '\n' +
      '┃\n' +
      '┃ ' + verdict + '\n' +
      '╰───────────────━⊷',
    mentions: [sender],
  })
}
