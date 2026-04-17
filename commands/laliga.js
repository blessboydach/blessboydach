const { getStandings } = require('../lib/football')
module.exports = async (ctx) => {
  const { reply } = ctx
  try {
    const data = await getStandings('PD')
    let text = '╭───────────────━⊷\n┃ 🇪🇸 *LA LIGA TABLE*\n╰───────────────━⊷\n\n'
    data.standings[0].table.slice(0,10).forEach((t,i) => text += `┃ ${i+1}. ${t.team.shortName} — ${t.points} pts\n`)
    await reply(text)
  } catch(e){ await reply('❌ Could not load La Liga table.') }
}