// ============================================================
//  VANGUARD MD — commands/tiktok.js
//  TikTok video downloader — no watermark
// ============================================================

const axios   = require('axios')
const config   = require('../config')
const defaults = require('../defaults')

const TIKTOK_REGEX = /https?:\/\/(?:(?:www|vm|vt|m)\.)?tiktok\.com\/[^\s]+/i

module.exports = async (ctx) => {
  const { sock, msg, jid, args, reply } = ctx

  const url = args.join(' ').trim()

  if (!url) return reply(
    '╭───────────────━⊷\n' +
    '┃ 🎵 *TIKTOK DOWNLOADER*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ _Usage: .tiktok <tiktok link>_\n' +
    '╰───────────────━⊷'
  )

  if (!TIKTOK_REGEX.test(url)) return reply('❌ That is not a valid TikTok link!')

  await reply('⏳ *Downloading TikTok video...*')

  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  try {
    const { data } = await axios.get(
      'https://discardapi.onrender.com/api/dl/tiktok?apikey=guru&url=' + encodeURIComponent(url),
      {
        timeout: 45000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }
    )

    if (!data?.status || !data?.result) throw new Error('Invalid API response')

    const res      = data.result
    const hd       = res.data?.find(v => v.type === 'nowatermark_hd')
    const noWm     = res.data?.find(v => v.type === 'nowatermark')
    const videoUrl = hd?.url || noWm?.url

    if (!videoUrl) throw new Error('No downloadable video found')

    const caption =
      '╭───────────────━⊷\n' +
      '┃ 🎵 *TIKTOK*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 👤 *User:* ' + (res.author?.nickname || 'Unknown') + '\n' +
      '┃ 🆔 *Username:* ' + (res.author?.fullname || 'Unknown') + '\n' +
      '┃ 🌍 *Region:* ' + (res.region || 'Unknown') + '\n' +
      '┃ ⏱️ *Duration:* ' + (res.duration || 'Unknown') + '\n' +
      '┃\n' +
      '┃ ❤️ *Likes:* ' + (res.stats?.likes || '0') + '\n' +
      '┃ 💬 *Comments:* ' + (res.stats?.comment || '0') + '\n' +
      '┃ 🔁 *Shares:* ' + (res.stats?.share || '0') + '\n' +
      '┃ 👀 *Views:* ' + (res.stats?.views || '0') + '\n' +
      '┃\n' +
      '┃ 🎧 *Sound:* ' + (res.music_info?.title || 'Unknown') + '\n' +
      '┃ 📅 *Posted:* ' + (res.taken_at || 'Unknown') + '\n' +
      '┃\n' +
      '┃ 📝 *Caption:*\n' +
      '┃ ' + (res.title || 'No caption') + '\n' +
      '┃\n' +
      '┃ ✨ *Quality:* ' + (hd ? 'HD No Watermark' : 'No Watermark') + '\n' +
      '╰───────────────━⊷\n' +
      '> _Powered by ' + botName + '_ 🔥'

    await sock.sendMessage(jid, {
      video:    { url: videoUrl },
      mimetype: 'video/mp4',
      caption,
    }, { quoted: msg })

  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      await reply('⏱️ Request timed out. Please try again later.')
    } else {
      await reply('❌ Failed to download TikTok video.\n_' + err.message + '_')
    }
  }
}
