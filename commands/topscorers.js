// ============================================================
//  VANGUARD MD – commands/topscorers.js
// ============================================================

const { getTopScorers, LEAGUE_CODES } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply, args } = ctx
  let code = args[0]?.toLowerCase()

  if (!code || !LEAGUE_CODES[code]) {
    return reply('Usage: .topscorers <league>\nExample: .topscorers pl')
  }

  code = LEAGUE_CODES[code]

  try {
    const data = await getTopScorers(code)
    let text = `╭───────────────━⊷\n`
    text += `┃ 🔥 *Top Scorers - ${data.competition.name}*\n`
    text += `╰───────────────━⊷\n\n`

    data.scorers.slice(0, 10).forEach((p, i) => {
      text += `┃ ${i+1}. ${p.player.name} (${p.team.shortName}) - ${p.goals} goals\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not fetch top scorers.')
  }
}