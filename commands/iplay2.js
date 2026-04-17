const audioDownloader = require('../lib/audioDownloader')
module.exports = async (ctx) => audioDownloader(ctx, 'document')