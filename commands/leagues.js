// ============================================================
//  VANGUARD MD – commands/leagues.js
// ============================================================

const { getLeagueList } = require('../lib/football')

module.exports = async (ctx) => {
  const { reply } = ctx

  try {
    const data = await getLeagueList()
    let text = '╭───────────────━⊷\n'
    text += '┃ 🌍 *AVAILABLE LEAGUES*\n'
    text += '╰───────────────━⊷\n\n'

    data.competitions.forEach(c => {
      text += `┃ ${c.area.name} | *${c.name}* (${c.code})\n`
    })

    await reply(text)
  } catch (e) {
    await reply('❌ Failed to fetch leagues.')
  }
}