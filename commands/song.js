// ============================================================
//  VANGUARD MD — commands/song.js
//  YouTube → mp3 playable audio
// ============================================================

const audioDownloader = require('../lib/audioDownloader')
module.exports = async (ctx) => audioDownloader(ctx, 'audio')
