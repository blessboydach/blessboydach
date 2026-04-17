// ============================================================
//  VANGUARD MD — commands/song2.js
//  YouTube → mp3 document download
// ============================================================

const audioDownloader = require('../lib/audioDownloader')
module.exports = async (ctx) => audioDownloader(ctx, 'document')
