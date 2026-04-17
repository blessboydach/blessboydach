// ============================================================
//  VANGUARD MD — commands/vanguardspam.js
//  Spam up to 100 messages (with safe delay) – FIXED bad-request
// ============================================================

const { isSudo } = require('../lib/utils')

module.exports = async (ctx) => {
    const { sock, reply, args } = ctx

    if (!ctx.isSudo) return reply('❌ Only owner/sudo can use this command!')

    const link = args[0]
    if (!link) {
        return reply(
            'Usage:\n' +
            '.vanguardspam <group_link> <message>          → spam 1 message 100 times\n' +
            '.vanguardspam <group_link> | msg1 | msg2 | ...   → send up to 100 different messages'
        )
    }

    const code = link.split('chat.whatsapp.com/')[1]?.trim()
    if (!code || code.length < 20) return reply('❌ Invalid group link! Use full chat.whatsapp.com/... link')

    // ── Get JID (join or already member) ────────────────────────
    let jid
    try {
        jid = await sock.groupAcceptInvite(code)
    } catch (err) {
        if (err.message.includes('bad-request') || err.message.includes('already')) {
            try {
                const metadata = await sock.groupGetInviteInfo(code)
                jid = metadata.id
                reply('ℹ️ Already in group — continuing with spam')
            } catch {
                return reply('❌ Cannot access group. Link may be invalid/expired.')
            }
        } else {
            return reply('❌ Join failed: ' + err.message)
        }
    }

    // ── Split messages by "|" ───────────────────────────────────
    const rawInput = args.slice(1).join(' ')
    let messages = rawInput.split('|')
        .map(m => m.trim())
        .filter(m => m.length > 0)

    if (messages.length === 0 && args[1]) {
        messages = [args.slice(1).join(' ')]
    }

    if (messages.length === 0) {
        messages = ['VANGUARD MD SPAM 🔥']
    }

    const totalToSend = Math.min(messages.length * 100, 100)
    let sentCount = 0

    reply(`🚀 Starting spam to group...\nSending up to 100 messages...`)

    for (let i = 0; i < 100; i++) {
        const msg = messages[i % messages.length]

        try {
            await sock.sendMessage(jid, { text: msg })
            sentCount++
            await new Promise(r => setTimeout(r, 700 + Math.random() * 600)) // 700-1300ms
        } catch (e) {
            break
        }
    }

    return reply(
        `✅ Vanguard Spam Complete!\n` +
        `📨 Messages sent: ${sentCount}/100\n` +
        `🔥 Group: ${jid.split('@')[0]}`
    )
}