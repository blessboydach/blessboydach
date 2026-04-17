// ============================================================
//  VANGUARD MD - commands/spotify.js
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, sock, jid, args, msg, command, prefix } = ctx

  const query = args.join(' ').trim()
  if (!query) {
    return reply(
      '🎵 SPOTIFY\n\n' +
      'Usage: ' + prefix + command + ' <song/artist>\n' +
      'Example: ' + prefix + command + ' con calma'
    )
  }

  await reply('🔍 Searching Spotify...')

  let r
  try {
    const { data } = await axios.get(
      'https://okatsu-rolezapiiz.vercel.app/search/spotify?q=' + encodeURIComponent(query),
      { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } }
    )
    if (!data?.status || !data?.result) throw new Error('No result from API')
    r = data.result
  } catch (e) {
    return reply('❌ Failed to search Spotify!\n' + (e.message || 'Try again later'))
  }

  if (!r.audio) {
    return reply('❌ No downloadable audio found for: ' + query)
  }

  const title    = r.title    || r.name   || 'Unknown Title'
  const artist   = r.artist   || ''
  const duration = r.duration || ''
  const url      = r.url      || ''

  const caption =
    '🎵 ' + title + '\n' +
    (artist   ? '🎤 ' + artist   + '\n' : '') +
    (duration ? '⏱️ ' + duration + '\n' : '') +
    (url      ? '🔗 ' + url      + '\n' : '')

  // Send cover image + info
  try {
    if (r.thumbnails) {
      await sock.sendMessage(jid, {
        image: { url: r.thumbnails },
        caption: caption,
      }, { quoted: msg })
    } else {
      await reply(caption)
    }
  } catch (e) {
    await reply(caption)
  }

  // Send audio
  try {
    await sock.sendMessage(jid, {
      audio: { url: r.audio },
      mimetype: 'audio/mpeg',
      fileName: title.replace(/[\/:*?"<>|]/g, '') + '.mp3',
    }, { quoted: msg })
  } catch (e) {
    await reply('❌ Failed to send audio!\n' + e.message)
  }
}
