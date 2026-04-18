// ============================================================
//  VANGUARD MD — commands/ss.js
//  Webpage Screenshot using ssweb API
//  Usage: .ss <url>
// ============================================================

module.exports = async (ctx) => {
  const { sock, jid, msg, args, reply } = ctx

  const url = args.join(' ').trim()

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return reply(
      '📸 *SCREENSHOT*\n\n' +
      'Usage: .ss <full url>\n' +
      'Example:\n' +
      '.ss https://github.com\n' +
      '.ss https://instagram.com/admminblue\n\n' +
      'Powered by Dach Tech'
    )
  }

  await reply('📸 Taking screenshot...')

  try {
    const apiUrl = `https://eliteprotech-apis.zone.id/e.id/ssweb?url=${encodeURIComponent(url)}`

    await sock.sendMessage(jid, {
      image: { url: apiUrl },
      caption: `📸 *Screenshot*\n${url}\n\nPowered by Vanguard MD`
    }, { quoted: msg })

  } catch (error) {
    console.error('Screenshot error:', error.message)
    await reply('❌ Failed to take screenshot.\nThe site might be protected.')
  }
}
