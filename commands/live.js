// ============================================================
//  VANGUARD MD – commands/live.js
// ============================================================

const { getLiveMatches } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply } = ctx

  try {
    const data = await getLiveMatches()
    if (!data.matches || data.matches.length === 0) {
      return reply('✅ No live matches right now.')
    }

    let text = '╭───────────────━⊷\n'
    text += '┃ ⚽ *LIVE MATCHES*\n'
    text += '╰───────────────━⊷\n\n'

    data.matches.forEach(m => {
      text += `┃ ${m.homeTeam.name} ${m.score.fullTime.home ?? '-'} - ${m.score.fullTime.away ?? '-'} ${m.awayTeam.name}\n`
      text += `┃ ${m.competition.name}\n\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not fetch live scores.')
  }
}