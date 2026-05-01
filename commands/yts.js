// ============================================================
//  VANGUARD MD — commands/yts.js
//  YouTube Search Command
// ============================================================

const yts = require('yt-search')

module.exports = async (ctx) => {
  const { reply, args } = ctx

  const query = args.join(' ').trim()

  if (!query) {
    return reply(
      `🎥 *YouTube Search*\n\n` +
      `Usage: *.yts* <search term>\n\n` +
      `Example:\n` +
      `*.yts* shape of you\n` +
      `*.yts* latest afrobeats 2026`
    )
  }

  await reply(`🔍 Searching YouTube for: *${query}*...`)

  try {
    const result = await yts(query)

    if (!result.videos || result.videos.length === 0) {
      return reply('❌ No results found on YouTube.')
    }

    // Take top 6 results
    const videos = result.videos.slice(0, 6)

    let text = `📽️ *YouTube Search Results*\n` +
               `🔎 Query: *${query}*\n\n`

    videos.forEach((video, index) => {
      text += 
        `*${index + 1}.* ${video.title}\n` +
        `📽️ *Channel:* ${video.author.name}\n` +
        `🕰️ *Duration:* ${video.timestamp}\n` +
        `👀 *Views:* ${video.views.toLocaleString()}\n` +
        `🔗 *Link:* ${video.url}\n\n`
    })

    text += `_Use prefix + video/song + link to _\n` +
            `to get download the media later 🔥`

    await reply(text)

  } catch (err) {
    console.error('[YTS ERROR]', err)
    await reply('❌ Failed to search YouTube. Try again later.')
  }
}
