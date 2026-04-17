// ============================================================
//  VANGUARD MD – commands/fixtures.js
// ============================================================

const { getFixtures, LEAGUE_CODES } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply, args } = ctx
  let code = args[0]?.toLowerCase()

  if (!code || !LEAGUE_CODES[code]) {
    return reply('Usage: .fixtures <league>\nExample: .fixtures pl')
  }

  code = LEAGUE_CODES[code]

  try {
    const data = await getFixtures(code, 10)
    let text = `╭───────────────━⊷\n`
    text += `┃ 📅 *${data.competition.name} Fixtures*\n`
    text += `╰───────────────━⊷\n\n`

    data.matches.slice(0, 12).forEach(m => {
      text += `┃ ${m.homeTeam.name} vs ${m.awayTeam.name}\n`
      text += `┃ ${m.utcDate.slice(0,16).replace('T',' ')}\n\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not fetch fixtures.')
  }
}