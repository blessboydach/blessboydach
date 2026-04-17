// ============================================================
//  VANGUARD MD — commands/iplay.js
//  YouTube → mp3 playable audio
// ============================================================

const audioDownloader = require('../lib/audioDownloader')
module.exports = async (ctx) => audioDownloader(ctx, 'audio')
