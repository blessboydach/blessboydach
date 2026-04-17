// ============================================================
//  VANGUARD MD — commands/tictactoe.js
// ============================================================

const { jidToNum } = require('../lib/utils')

const activeGames = new Map()

const renderBoard = (board) => {
  const symbols = { X: '❌', O: '⭕', null: '⬜' }
  return [
    symbols[board[0]] + symbols[board[1]] + symbols[board[2]],
    symbols[board[3]] + symbols[board[4]] + symbols[board[5]],
    symbols[board[6]] + symbols[board[7]] + symbols[board[8]],
  ].join('\n')
}

const checkWinner = (board) => {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ]
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(cell => cell !== null)) return 'draw'
  return null
}

module.exports = async (ctx) => {
  const { reply, jid, sender, mentions, quoted } = ctx

  let opponent = mentions?.[0] || null
  if (!opponent && quoted?.sender) opponent = quoted.sender

  if (!opponent)        return reply('❌ Mention someone to challenge!\n_Example: .tictactoe @user_')
  if (opponent === sender) return reply('❌ You cannot play against yourself!')
  if (activeGames.has(jid)) return reply('❌ A game is already active in this chat!\nFinish it first or wait.')

  const game = {
    board:       Array(9).fill(null),
    players:     { X: sender, O: opponent },
    currentTurn: sender,
    symbol:      { [sender]: 'X', [opponent]: 'O' },
  }

  activeGames.set(jid, game)

  const senderNum   = jidToNum(sender)
  const opponentNum = jidToNum(opponent)

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ 🎮 *TIC TAC TOE*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ ❌ @' + senderNum + '\n' +
      '┃    vs\n' +
      '┃ ⭕ @' + opponentNum + '\n' +
      '┃\n' +
      '┃ ' + renderBoard(game.board).split('\n').join('\n┃ ') + '\n' +
      '┃\n' +
      '┃ 🎯 *Positions:*\n' +
      '┃ 1️⃣2️⃣3️⃣\n' +
      '┃ 4️⃣5️⃣6️⃣\n' +
      '┃ 7️⃣8️⃣9️⃣\n' +
      '┃\n' +
      '┃ ▶️ @' + senderNum + '\'s turn (❌)\n' +
      '┃ 💬 Use *.move <1-9>* to play!\n' +
      '╰───────────────━⊷',
    mentions: [sender, opponent],
  })
}

module.exports.activeGames = activeGames
module.exports.renderBoard = renderBoard
module.exports.checkWinner = checkWinner
