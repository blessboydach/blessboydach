// ============================================================
//  VANGUARD MD – commands/standings.js
// ============================================================

const { getStandings, LEAGUE_CODES } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply, args } = ctx
  let code = args[0]?.toLowerCase()

  if (!code || !LEAGUE_CODES[code]) {
    return reply('Usage: .standings <league>\nExample: .standings pl  or  .standings laliga')
  }

  code = LEAGUE_CODES[code]

  try {
    const data = await getStandings(code)
    const table = data.standings[0].table

    let text = `╭───────────────━⊷\n`
    text += `┃ 📊 *${data.competition.name} Standings*\n`
    text += `╰───────────────━⊷\n\n`

    table.slice(0, 10).forEach((team, i) => {
      text += `┃ ${i+1}. ${team.team.name} | ${team.points} pts (${team.playedGames} games)\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not fetch standings.')
  }
}