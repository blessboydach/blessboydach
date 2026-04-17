// ============================================================
//  VANGUARD MD — commands/save2.js
//  Forward status to owner inbox
// ============================================================

const save = require('./save')

module.exports = async (ctx) => {
  ctx.command = 'save2'
  await save(ctx)
}
