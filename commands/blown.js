// commands/blown.js
const { applyEffect } = require('../lib/audioEffects')
module.exports = async (ctx) => applyEffect(ctx, 'blown')
