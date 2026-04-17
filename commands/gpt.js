// ============================================================
//  VANGUARD MD — commands/gpt.js
// ============================================================

const aihelper = require('../lib/aihelper')

module.exports = async (ctx) => aihelper(ctx, {
  emoji: '🤖',
  name:  'GPT AI',
})
