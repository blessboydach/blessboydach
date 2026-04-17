// ============================================================
//  VANGUARD MD — commands/base64.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, args } = ctx

  const mode = args[0]?.toLowerCase()
  const text = args.slice(1).join(' ')

  if (!mode || !text) {
    return reply(
      '🔒 *BASE64*\n' +
      '❌ Usage:\n' +
      '• *.base64 encode <text>*\n' +
      '• *.base64 decode <text>*\n' +
      ''
    )
  }

  if (mode === 'encode') {
    const encoded = Buffer.from(text, 'utf8').toString('base64')
    await reply(
      '🔒 *BASE64 ENCODE*\n' +
      '📥 *Input:* _' + text + '_\n' +
      '📤 *Encoded:*\n' +
      '`' + encoded + '`\n' +
      ''
    )

  } else if (mode === 'decode') {
    try {
      const decoded = Buffer.from(text, 'base64').toString('utf8')
      await reply(
        '🔓 *BASE64 DECODE*\n' +
        '📥 *Input:* _' + text + '_\n' +
        '📤 *Decoded:*\n' +
        '`' + decoded + '`\n' +
        ''
      )
    } catch (err) {
      await reply('❌ Invalid Base64 string!')
    }

  } else {
    await reply('❌ Mode must be *encode* or *decode*\n_Example: .base64 encode Hello World_')
  }
}
