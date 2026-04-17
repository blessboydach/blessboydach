// ============================================================
//  VANGUARD MD — commands/vv2.js
//  Forward view-once to owner inbox
// ============================================================

const vv = require('./vv')

module.exports = async (ctx) => {
  ctx.command = 'vv2'
  await vv(ctx)
}
