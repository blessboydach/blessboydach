// ============================================================
//  VANGUARD MD — commands/setprefix.js
// ============================================================

const config = require('../config')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx

  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const newPrefix = args[0]?.trim()

  if (!newPrefix) {
    return reply(
      '❌ Provide a new prefix!\n' +
      'Example: .setprefix !\n' +
      'No prefix: .setprefix none'
    )
  }

  // Block forbidden prefixes
  if (newPrefix === '>' || newPrefix === '~') {
    return reply(
      '❌ Invalid prefix!\n' +
      'Do not use > or ~\n' +
      'Try another prefix'
    )
  }

  if (newPrefix.length > 10) {
    return reply('❌ Prefix too long! Max 10 characters.')
  }

  const oldPrefix = config.prefix
  const isNoneMode = newPrefix.toLowerCase() === 'none'

  config.prefix = isNoneMode ? 'none' : newPrefix

  let text =
    'Old: ' + (oldPrefix === 'none' ? 'none (no prefix)' : oldPrefix) + '\n' +
    'New: ' + (isNoneMode ? 'none (no prefix)' : newPrefix) + '\n'

  if (isNoneMode) {
    text +=
      'Sigma Mode ON\n' +
      'Commands work without prefix\n' +
      'Example: menu, ping, help'
  } else {
    text +=
      'Commands now use prefix: ' + newPrefix + '\n' +
      'Example: ' + newPrefix + 'menu'
  }

  await reply(text)
}
