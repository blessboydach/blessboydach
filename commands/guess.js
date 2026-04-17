// ============================================================
//  VANGUARD MD — commands/guess.js
// ============================================================

const { randInt, jidToNum } = require('../lib/utils')

const activeGames = new Map()

module.exports = async (ctx) => {
  const { reply, jid, sender, args } = ctx
  const senderNum = jidToNum(sender)

  const guessVal = parseInt(args[0])

  if (!isNaN(guessVal)) {
    const game = activeGames.get(jid)
    if (!game) return reply('❌ No active game! Start one with *.guess*')

    game.attempts++
    const { number, attempts, maxAttempts } = game
    const remaining = maxAttempts - attempts

    if (guessVal === number) {
      activeGames.delete(jid)
      return reply({
        text: '🎉 *Correct!* @' + senderNum + ' got it in *' + attempts + '* attempt' + (attempts > 1 ? 's' : '') + '!\n🔢 The number was *' + number + '*',
        mentions: [sender],
      })
    }

    if (attempts >= maxAttempts) {
      activeGames.delete(jid)
      return reply('💀 *Game Over!*\nThe number was *' + number + '*\nBetter luck next time! Try *.guess* again.')
    }

    const hint = guessVal < number ? '📈 Too LOW! Go higher!' : '📉 Too HIGH! Go lower!'
    return reply(hint + '\n🎯 Attempts left: *' + remaining + '*')
  }

  // ── Already active ────────────────────────────────────────
  if (activeGames.has(jid)) {
    const game = activeGames.get(jid)
    return reply('🎮 A game is already active!\n🔢 Guess a number between *1–100*\n🎯 Attempts left: *' + (game.maxAttempts - game.attempts) + '*')
  }

  // ── Start new game ────────────────────────────────────────
  const number = randInt(1, 100)
  activeGames.set(jid, { number, attempts: 0, maxAttempts: 7, startedBy: sender })

  await reply({
    text:
      '🎮 *GUESS THE NUMBER*\n' +
      '@' + senderNum + ' started a game!\n' +
      '🔢 Guess a number between *1 and 100*\n' +
      '🎯 You have *7 attempts*\n' +
      '💬 Type *.guess <number>* to guess!\n' +
      '_Example: .guess 50_\n' +
      '',
    mentions: [sender],
  })
}
