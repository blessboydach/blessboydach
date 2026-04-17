// ============================================================
//  VANGUARD MD — commands/move.js
// ============================================================

const { jidToNum } = require('../lib/utils')
const { activeGames, renderBoard, checkWinner } = require('./tictactoe')

module.exports = async (ctx) => {
  const { reply, jid, sender, args } = ctx

  const game = activeGames.get(jid)
  if (!game) {
    return reply('❌ No active Tic Tac Toe game!\nStart one with *.tictactoe @user*')
  }

  const isPlayer = game.players.X === sender || game.players.O === sender
  if (!isPlayer) {
    return reply('❌ You are not part of this game!')
  }

  if (game.currentTurn !== sender) {
    const currentNum = jidToNum(game.currentTurn)
    return reply({
      text:     '⏳ It\'s not your turn!\n🎯 Waiting for @' + currentNum + ' to move.',
      mentions: [game.currentTurn],
    })
  }

  const pos = parseInt(args[0])
  if (isNaN(pos) || pos < 1 || pos > 9) {
    return reply('❌ Invalid position! Choose between *1-9*\n_Example: .move 5_')
  }

  const index = pos - 1
  if (game.board[index] !== null) {
    return reply('❌ That position is already taken! Choose another.')
  }

  const symbol    = game.symbol[sender]
  game.board[index] = symbol

  const winner    = checkWinner(game.board)
  const senderNum = jidToNum(sender)

  if (winner === 'draw') {
    activeGames.delete(jid)
    return reply(
      '🤝 *IT\'S A DRAW!*\n' +
      '' + renderBoard(game.board).split('\n').join('\n') + '\n' +
      'Well played both! 🎮\n' +
      ''
    )
  }

  if (winner) {
    activeGames.delete(jid)
    const winnerJid = game.players[winner]
    const winnerNum = jidToNum(winnerJid)
    return reply({
      text:
        '🏆 *WINNER!*\n' +
        '' + renderBoard(game.board).split('\n').join('\n') + '\n' +
        '🎉 @' + winnerNum + ' wins as ' + (winner === 'X' ? '❌' : '⭕') + '!\n' +
        'Congratulations! 🥳\n' +
        '',
      mentions: [winnerJid],
    })
  }

  const nextPlayer = game.currentTurn === game.players.X ? game.players.O : game.players.X
  game.currentTurn = nextPlayer
  const nextNum    = jidToNum(nextPlayer)
  const nextSymbol = game.symbol[nextPlayer]

  await reply({
    text:
      '🎮 *TIC TAC TOE*\n' +
      '' + renderBoard(game.board).split('\n').join('\n') + '\n' +
      '@' + senderNum + ' played ' + (symbol === 'X' ? '❌' : '⭕') + ' at position *' + pos + '*\n' +
      '▶️ @' + nextNum + '\'s turn (' + (nextSymbol === 'X' ? '❌' : '⭕') + ')\n' +
      '💬 Use *.move <1-9>* to play!\n' +
      '',
    mentions: [sender, nextPlayer],
  })
}
