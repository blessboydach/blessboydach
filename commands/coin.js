// ============================================================
//  VANGUARD MD — commands/coin.js
// ============================================================

const { randInt } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const flip   = randInt(0, 1)
  const result = flip === 0 ? 'HEADS' : 'TAILS'
  const emoji  = flip === 0 ? '🪙' : '💿'

  await reply(
    '🪙 *COIN FLIP*\n' +
    '' + emoji + ' *Result:* ' + result + '\n' +
    '_Flip again with .coin_\n' +
    ''
  )
}
