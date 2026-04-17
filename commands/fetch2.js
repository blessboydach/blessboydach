// ============================================================
//  VANGUARD MD — commands/fetch2.js
//  Forward status to owner inbox
// ============================================================

const fetch = require('./fetch')

module.exports = async (ctx) => {
  ctx.command = 'fetch2'
  await fetch(ctx)
}
