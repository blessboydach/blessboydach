// ============================================================
//  VANGUARD MD — commands/addbadword.js
// ============================================================

const { saveGroupSettings, getGroupSettings } = require('../lib/utils')
const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, jid, fromGroup, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  if (!isSudo)    return reply('❌ Only sudo/owner can use this command!')

  const word = args[0]?.toLowerCase().trim()
  if (!word)           return reply('❌ Provide a word to add!\n_Example: .addbadword badword_')
  if (word.length < 2) return reply('❌ Word too short! Minimum 2 characters.')
  if (word.length > 30) return reply('❌ Word too long! Maximum 30 characters.')

  const settings    = getGroupSettings(jid)
  const customWords = settings.customBadWords || []

  if (customWords.includes(word)) {
    return reply(
      '🤬 *BAD WORD LIST*\n' +
      '⚠️ *"' + word + '"* is already listed!\n' +
      '📋 *Total words:* ' + customWords.length + '\n' +
      '> *_' + (config.botName || defaults.botName || 'VANGUARD MD') + '_*'
    )
  }

  customWords.push(word)
  saveGroupSettings(jid, { customBadWords: customWords })

  await reply(
    '🤬 *BAD WORD ADDED*\n' +
    '✅ *Added:* "' + word + '"\n' +
    '📋 *Total words:* ' + customWords.length + '\n' +
    '💡 Enable with *.antibadword warn on*\n' +
    '\n' 
  )
}
