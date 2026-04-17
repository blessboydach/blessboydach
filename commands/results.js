// ============================================================
//  VANGUARD MD – commands/results.js
// ============================================================

const { getResults, LEAGUE_CODES } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply, args } = ctx
  let code = args[0]?.toLowerCase()

  if (!code || !LEAGUE_CODES[code]) {
    return reply('Usage: .results <league>\nExample: .results pl')
  }

  code = LEAGUE_CODES[code]

  try {
    const data = await getResults(code)
    let text = `╭───────────────━⊷\n`
    text += `┃ 📜 *Recent Results - ${data.competition.name}*\n`
    text += `╰───────────────━⊷\n\n`

    data.matches.slice(0, 10).forEach(m => {
      text += `┃ ${m.homeTeam.name} ${m.score.fullTime.home} - ${m.score.fullTime.away} ${m.awayTeam.name}\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not fetch results.')
  }
}