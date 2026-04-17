// ============================================================
//  VANGUARD MD — commands/vanguardsend.js
//  Advanced: Join + Send up to 3 messages (or close/open)
// ============================================================

const { isSudo } = require('../lib/utils')

module.exports = async (ctx) => {
    const { sock, reply, args } = ctx

    if (!ctx.isSudo) return reply('❌ Only owner/sudo can use this command!')

    const action = args[0]?.toLowerCase()
    const link   = action === 'close' || action === 'open' ? args[1] : args[0]

    if (!link) {
        return reply(
            'Usage:\n' +
            '.vanguardsend <group_link>               → join + send 3 messages\n' +
            '.vanguardsend <group_link> | msg1 | msg2 | msg3\n' +
            '.vanguardsend close <group_link>\n' +
            '.vanguardsend open <group_link>'
        )
    }

    // Extract invite code
    const code = link.split('chat.whatsapp.com/')[1]
    if (!code) return reply('❌ Invalid group link!')

    try {
        // Join group (works even if already member)
        const jid = await sock.groupAcceptInvite(code)

        // ── CLOSE / OPEN MODE ─────────────────────────────────────
        if (action === 'close' || action === 'open') {
            await sock.groupSettingUpdate(jid, action === 'close' ? 'announcement' : 'not_announcement')

            await sock.sendMessage(jid, {
                text: `⚙️ Group has been ${action === 'close' ? 'closed' : 'opened'} by Vanguard MD`
            })

            return reply(`✅ Group ${action}ed successfully.`)
        }

        // ── ADVANCED SEND MODE (3 messages max) ───────────────────
        const rawMessages = args.slice(1).join(' ').split('|')
        let messages = rawMessages
            .map(m => m.trim())
            .filter(m => m)
            .slice(0, 3)

        // If user gave 0 messages → use 3 defaults
        if (messages.length === 0) {
            messages = [
                '🔥 Vanguard MD has entered',
                '👀 Am Watching ',
                '⚡ Wassup yall '
            ]
        }

        // Send up to 3 messages with small delay
        for (let i = 0; i < messages.length; i++) {
            await sock.sendMessage(jid, { text: messages[i] })
            if (i < messages.length - 1) {
                await new Promise(r => setTimeout(r, 900)) // safe delay
            }
        }

        return reply(`✅ Joined group and sent ${messages.length} messages successfully.`)

    } catch (err) {
        return reply('❌ Failed: ' + err.message)
    }
}