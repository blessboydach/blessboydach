// Alias for .vomem
const { sendViewOnceTag } = require('./votagall')
module.exports = async (ctx) => sendViewOnceTag(ctx, 'members')

EOF.