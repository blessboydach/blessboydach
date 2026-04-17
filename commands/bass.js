// commands/bass.js
const { applyEffect } = require('../lib/audioEffects')
module.exports = async (ctx) => applyEffect(ctx, 'bass')
