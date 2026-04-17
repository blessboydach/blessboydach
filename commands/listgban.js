// ============================================================
//  VANGUARD MD – commands/listgban.js
// ============================================================

const { getGBanList } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const list = getGBanList().filter((n) => n !== DEV)

if (!list.length) return reply(
'🔨 *GROUP BAN LIST*\n' +
'✅ No users group banned\n' +
''
)

const lines = list.map((n, i) => '' + (i + 1) + '. +' + n).join('\n')
await reply(
'🔨 *GROUP BANS (' + list.length + ')*\n' +
lines + '\n' +
''
)
}