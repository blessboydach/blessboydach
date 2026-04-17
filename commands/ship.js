// ============================================================
//  VANGUARD MD — commands/ship.js
// ============================================================

const { randInt, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, mentions, sender } = ctx

  let user1 = mentions?.[0] || null
  let user2 = mentions?.[1] || null

  if (user1 && !user2) {
    user2 = user1
    user1 = sender
  }

  if (!user1 || !user2) {
    return reply('❌ Mention two users to ship!\n_Example: .ship @user1 @user2_')
  }

  const percent  = randInt(1, 100)
  const num1     = jidToNum(user1)
  const num2     = jidToNum(user2)
  const name1    = num1.slice(0, Math.ceil(num1.length / 2))
  const name2    = num2.slice(Math.floor(num2.length / 2))
  const shipName = name1 + name2
  const filled   = Math.round(percent / 10)
  const empty    = 10 - filled
  const meter    = '❤️'.repeat(filled) + '🖤'.repeat(empty)

  let verdict = ''
  if (percent >= 90)      verdict = '💍 Soulmates! Perfect match!'
  else if (percent >= 70) verdict = '😍 Strong connection!'
  else if (percent >= 50) verdict = '😊 Good potential!'
  else if (percent >= 30) verdict = '🤔 It could work...'
  else if (percent >= 10) verdict = '😬 Needs a lot of work...'
  else                    verdict = '💔 Not meant to be!'

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ 💘 *SHIP CALCULATOR*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 👤 @' + num1 + '\n' +
      '┃ 💕 +\n' +
      '┃ 👤 @' + num2 + '\n' +
      '┃\n' +
      '┃ 💑 *Ship Name:* ' + shipName + '\n' +
      '┃ ❤️ *Compatibility:* ' + percent + '%\n' +
      '┃ ' + meter + '\n' +
      '┃\n' +
      '┃ 💬 ' + verdict + '\n' +
      '╰───────────────━⊷',
    mentions: [user1, user2],
  })
}
