// ============================================================
//  VANGUARD MD – commands/remdmban.js
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { remDMBan } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const result = await resolveTarget(args, quoted, msg, sock, jid)
if (result.wasLid) return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .remdmban 256XXXXXXXXX_')
if (!result.num)   return reply('❌ *No target!* Tag, reply, or provide a number.')

const num = result.num

// Dev is never in dmban – treat as silent success
if (num === DEV) {
return reply(
'╭───────────────━⊷\n' +
'┃ ✅ *DM BAN LIFTED*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 👤 *+' + num + '*\n' +
'┃ ✅ Unblocked from DMs\n' +
'╰───────────────━⊷'
)
}

const removed = remDMBan(num)
if (!removed) return reply('⚠️ *+' + num + ' is not in DM ban list!*')

await reply(
'╭───────────────━⊷\n' +
'┃ ✅ *DM BAN LIFTED*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 👤 *+' + num + '*\n' +
'┃ ✅ Unblocked from DMs\n' +
'╰───────────────━⊷'
)
}