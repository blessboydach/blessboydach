// ============================================================
//  VANGUARD MD – commands/epltable.js
//  Quick Premier League Current Table
// ============================================================

const { getStandings } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply } = ctx

  try {
    const data = await getStandings('PL')
    const table = data.standings[0].table

    let text = '╭───────────────━⊷\n'
    text += '┃ 🏴󠁧󠁢󠁥󠁮󠁧󠁿 *PREMIER LEAGUE TABLE*\n'
    text += '╰───────────────━⊷\n\n'

    table.slice(0, 10).forEach((t, i) => {
      text += `┃ ${i+1}. ${t.team.shortName || t.team.name} — ${t.points} pts (${t.playedGames} played)\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Could not load Premier League table right now.')
  }
}