// ============================================================
//  VANGUARD MD — commands/lyrics.js
//  Lyrics Finder (Open to everyone)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, sock, args, msg } = ctx

  if (args.length === 0) {
    return reply(
      '🎵 *Lyrics Finder*\n' +
      'Usage:\n' +
      '.lyrics Song Name\n' +
      'Example: .lyrics Despacito\n' +
      '         .lyrics Shape of You'
    )
  }

  const query = args.join(' ')
  await reply('⏳ Searching for lyrics...')

  try {

    let lyricsData = null

    // ── API 1: Vreden (Primary) ───────────────────────────────
    try {
      const res = await axios.get(`https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(query)}`)
      if (res.data?.result) {
        lyricsData = {
          title:     res.data.result.title,
          artist:    res.data.result.artist,
          lyrics:    res.data.result.lyrics,
          thumbnail: res.data.result.thumbnail,
        }
      }
    } catch (_) {}

    // ── API 2: Siputzx (Fallback) ─────────────────────────────
    if (!lyricsData) {
      try {
        const res = await axios.get(`https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`)
        if (res.data?.status && res.data?.data) {
          lyricsData = {
            title:     res.data.data.title,
            artist:    res.data.data.artist,
            lyrics:    res.data.data.lyrics,
            thumbnail: res.data.data.image,
          }
        }
      } catch (_) {}
    }

    if (!lyricsData) {
      return reply('❌ Could not find lyrics for this song. Try a different name.')
    }

    let lyrics = lyricsData.lyrics
    if (lyrics.length > 4000) {
      lyrics = lyrics.substring(0, 4000) + '\n... (Lyrics too long, showing first part only)'
    }

    const caption =
      `🎵 *${lyricsData.title}*\n` +
      `👤 *${lyricsData.artist}*\n` +
      `📝 *Lyrics:*\n${lyrics}\n` +
      `_Fetched by VANGUARD MD_`

    if (lyricsData.thumbnail) {
      await sock.sendMessage(msg.key.remoteJid, {
        image:   { url: lyricsData.thumbnail },
        caption: caption,
      }, { quoted: msg })
    } else {
      await sock.sendMessage(msg.key.remoteJid, {
        text: caption,
      }, { quoted: msg })
    }

  } catch (error) {
    console.error('Lyrics command error:', error)
    await reply('❌ An error occurred while fetching lyrics!')
  }
}
