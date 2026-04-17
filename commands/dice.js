// ============================================================
//  VANGUARD MD — commands/dice.js
// ============================================================

const { randInt } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const roll  = randInt(1, 6)
  const faces = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }
  const msg   = roll === 6 ? '🎉 Maximum roll! Lucky you!'
              : roll === 1 ? '😬 Minimum roll! Better luck next time!'
              : '🎲 Roll again with .dice'

  await reply(
    '🎲 *DICE ROLL*\n' +
    '' + faces[roll] + ' *You rolled:* ' + roll + '\n' +
    '' + msg + '\n' +
    ''
  )
}
