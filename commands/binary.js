// ============================================================
//  VANGUARD MD — commands/binary.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, args } = ctx

  if (!args.length) {
    return reply('❌ Provide text to convert!\n_Example: .binary Hello_')
  }

  const text     = args.join(' ')
  const isBinary = /^[01\s]+$/.test(text)

  if (isBinary && text.includes(' ')) {
    try {
      const decoded = text
        .trim()
        .split(' ')
        .map(bin => String.fromCharCode(parseInt(bin, 2)))
        .join('')

      await reply(
        '🔢 *BINARY DECODE*\n' +
        '📥 *Binary:* _' + (text.length > 60 ? text.slice(0, 60) + '...' : text) + '_\n' +
        '📤 *Text:* ' + decoded + '\n' +
        ''
      )
    } catch {
      await reply('❌ Invalid binary string!')
    }
    return
  }

  if (text.length > 100) {
    return reply('❌ Text too long! Maximum 100 characters.')
  }

  const binary = text
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ')

  await reply(
    '🔢 *TEXT TO BINARY*\n' +
    '📥 *Text:* _' + text + '_\n' +
    '📤 *Binary:*\n' +
    '`' + binary + '`\n' +
    ''
  )
}
