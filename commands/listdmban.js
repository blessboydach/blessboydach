// ============================================================
//  VANGUARD MD – commands/listdmban.js
// ============================================================

const { getDMBanList } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const list = getDMBanList().filter((n) => n !== DEV)

if (!list.length) return reply(
'🔨 *DM BAN LIST*\n' +
'✅ No users DM banned\n' +
''
)

const lines = list.map((n, i) => '' + (i + 1) + '. +' + n).join('\n')
await reply(
'🔨 *DM BANS (' + list.length + ')*\n' +
lines + '\n' +
''
)
}