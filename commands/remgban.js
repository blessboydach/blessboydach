// ============================================================
//  VANGUARD MD – commands/remgban.js
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { remGBan } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const result = await resolveTarget(args, quoted, msg, sock, jid)
if (result.wasLid) return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .remgban 256XXXXXXXXX_')
if (!result.num)   return reply('❌ *No target!* Tag, reply, or provide a number.')

const num = result.num

// Dev is never in gban – treat as silent success
if (num === DEV) {
return reply(
'╭───────────────━⊷\n' +
'┃ ✅ *GROUP BAN LIFTED*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 👤 *+' + num + '*\n' +
'┃ ✅ Unblocked from groups\n' +
'╰───────────────━⊷'
)
}

const removed = remGBan(num)
if (!removed) return reply('⚠️ *+' + num + ' is not in group ban list!*')

await reply(
'╭───────────────━⊷\n' +
'┃ ✅ *GROUP BAN LIFTED*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 👤 *+' + num + '*\n' +
'┃ ✅ Unblocked from groups\n' +
'╰───────────────━⊷'
)
}