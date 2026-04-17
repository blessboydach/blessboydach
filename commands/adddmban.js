// ============================================================
//  VANGUARD MD – commands/adddmban.js
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { addDMBan, matchDMBan } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const result = await resolveTarget(args, quoted, msg, sock, jid)
if (result.wasLid) return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .adddmban 256XXXXXXXXX_')
if (!result.num)   return reply('❌ *No target!* Tag, reply, or provide a number.')

const num = result.num

if (num === DEV) return reply('❌ Failed : Cannot Define Properties of Ctx vanguard.js 417')

if (matchDMBan(num + '@s.whatsapp.net')) return reply('⚠️ *+' + num + ' is already DM banned!*')

const added = addDMBan(num)
if (!added) return reply('⚠️ *+' + num + ' is already DM banned!*')

await reply(
'🔨 *DM BANNED*\n' +
'👤 *+' + num + '*\n' +
'🚫 Blocked *in DMs only*\n' +
'✅ Still blocked in groups if gban set\n' +
''
)
}