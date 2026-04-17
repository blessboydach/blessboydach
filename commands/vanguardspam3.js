// ============================================================
//  VANGUARD MD — commands/vanguardspam3.js
//  Custom spam count (1–199 messages) – FIXED bad-request
// ============================================================

const { isSudo } = require('../lib/utils')

module.exports = async (ctx) => {
    const { sock, reply, args } = ctx

    if (!ctx.isSudo) return reply('❌ Only owner/sudo can use this command!')

    const link = args[0]
    if (!link) {
        return reply(
            'Usage:\n' +
            '.vanguardspam3 <group_link> <count> <message>\n\n' +
            'Examples:\n' +
            '.vanguardspam3 https://chat.whatsapp.com/ABC123 50 VANGUARD 🔥\n' +
            '.vanguardspam3 https://chat.whatsapp.com/ABC123 100 Test spam'
        )
    }

    const code = link.split('chat.whatsapp.com/')[1]?.trim()
    if (!code || code.length < 20) return reply('❌ Invalid group link! Use full chat.whatsapp.com/... link')

    let count = parseInt(args[1]) || 100
    count = Math.min(Math.max(count, 1), 199)

    let message = args.slice(2).join(' ') || 'VANGUARD MD SPAM 🔥'

    try {
        let jid

        // Try to join (or get existing JID)
        try {
            jid = await sock.groupAcceptInvite(code)
        } catch (err) {
            if (err.message.includes('bad-request') || err.message.includes('already')) {
                try {
                    const metadata = await sock.groupGetInviteInfo(code)
                    jid = metadata.id
                    reply('ℹ️ Already member — skipping join step')
                } catch {
                    return reply('❌ Cannot access group. Link expired or invalid.')
                }
            } else {
                throw err
            }
        }

        reply(`🚀 Starting spam → ${count} messages...`)

        let sent = 0

        for (let i = 0; i < count; i++) {
            try {
                await sock.sendMessage(jid, { text: message })
                sent++
                await new Promise(r => setTimeout(r, 180 + Math.random() * 120)) // 180–300 ms
            } catch (e) {
                break
            }
        }

        return reply(
            `✅ Done!\n` +
            `Sent: ${sent}/${count} messages\n` +
            `Group: ${jid.split('@')[0]}`
        )

    } catch (err) {
        return reply('❌ Failed: ' + (err.message || 'Unknown error'))
    }
}