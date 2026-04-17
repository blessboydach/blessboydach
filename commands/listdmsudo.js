// ============================================================
//  VANGUARD MD – commands/listdmsudo.js
// ============================================================

const { getDMSudoList } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const list = getDMSudoList().filter((n) => n !== DEV)

if (!list.length) return reply(
'⭐ *DM SUDO LIST*\n' +
'*No DM sudo users set*\n' +
''
)

const lines = list.map((n, i) => '' + (i + 1) + '. +' + n).join('\n')
await reply(
'⭐ *DM SUDO (' + list.length + ')*\n' +
lines + '\n' +
''
)
}