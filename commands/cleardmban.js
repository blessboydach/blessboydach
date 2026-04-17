// ============================================================
//  VANGUARD MD – commands/cleardmban.js
// ============================================================

const { clearDMBan } = require('../lib/authStore')

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

clearDMBan()

await reply(
'🔨 *DM BANS CLEARED*\n' +
'✅ All DM bans lifted\n' +
''
)
}