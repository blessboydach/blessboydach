// ============================================================
//  VANGUARD MD – commands/cleargban.js
// ============================================================

const { clearGBan } = require('../lib/authStore')

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

clearGBan()

await reply(
'🔨 *GROUP BANS CLEARED*\n' +
'✅ All group bans lifted\n' +
''
)
}