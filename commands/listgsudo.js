// ============================================================
//  VANGUARD MD – commands/listgsudo.js
// ============================================================

const { getGSudoList } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
    const { reply, isOwner, isSudo } = ctx

    if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

    // Filter dev out – invisible to users, still protected in file
    const list = getGSudoList().filter((n) => n !== DEV)

    if (!list.length) {
        return reply(
`

*No group sudo users set*
`
        )
    }

    const lines = list.map((n, i) => `${i + 1}. +${n}`).join('\n')

    await reply(
`

${lines}
`
    )
}