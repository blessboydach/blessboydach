// ============================================================
//  VANGUARD MD — commands/facebook.js
//  Facebook video downloader
// ============================================================

const axios = require('axios')

const AXIOS_OPTS = {
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  },
}

const resolveUrl = async (url) => {
  try {
    const r = await axios.get(url, { timeout: 20000, maxRedirects: 10, headers: { 'User-Agent': 'Mozilla/5.0' } })
    return r?.request?.res?.responseUrl || url
  } catch (_) { return url }
}

const parseVideoUrl = (data) => {
  if (!data) return null
  if (data.result) {
    if (data.result.media) return data.result.media.video_hd || data.result.media.video_sd
    if (typeof data.result === 'string' && data.result.startsWith('http')) return data.result
    if (data.result.url)      return data.result.url
    if (data.result.download) return data.result.download
    if (data.result.video)    return data.result.video
  }
  if (data.data) {
    if (typeof data.data === 'string' && data.data.startsWith('http')) return data.data
    if (typeof data.data === 'object' && !Array.isArray(data.data)) {
      if (data.data.url)      return data.data.url
      if (data.data.download) return data.data.download
      if (data.data.video)    return data.data.video
    }
    if (Array.isArray(data.data) && data.data.length > 0) {
      const hd = data.data.find(i => i.quality === 'HD' && i.url)
      const sd = data.data.find(i => i.quality === 'SD' && i.url)
      return hd?.url || sd?.url || data.data[0]?.url
    }
  }
  if (data.url)      return data.url
  if (data.download) return data.download
  if (data.video)    return typeof data.video === 'string' ? data.video : data.video?.url
  return null
}

const parseTitle = (data) => {
  return (
    data?.result?.info?.title ||
    data?.result?.title       ||
    data?.data?.title         ||
    data?.title               ||
    'Facebook Video'
  )
}

const fetchFromApi = async (url) => {
  const r = await axios.get(
    'https://api.hanggts.xyz/download/facebook?url=' + encodeURIComponent(url),
    { ...AXIOS_OPTS, validateStatus: s => s >= 200 && s < 500 }
  )
  const videoUrl = parseVideoUrl(r.data)
  if (!videoUrl) throw new Error('no video url in response')
  return { download: videoUrl, title: parseTitle(r.data) }
}

module.exports = async (ctx) => {
  const { sock, msg, jid, args, reply } = ctx
  const config   = require('../config')
  const defaults = require('../defaults')

  const url = args.join(' ').trim()

  if (!url) return reply(
    '📘 *FACEBOOK DOWNLOADER*\n' +
    '_Usage: .facebook <facebook link>_\n' +
    ''
  )

  if (!url.includes('facebook.com')) return reply('❌ That is not a Facebook link!')

  await reply('⏳ *Downloading Facebook video...*')

  let videoData
  try {
    const resolved = await resolveUrl(url)
    try {
      videoData = await fetchFromApi(resolved)
    } catch (_) {
      videoData = await fetchFromApi(url)
    }
  } catch (err) {
    return reply('❌ Failed to get video URL. The video may be private or unavailable.')
  }

  const botName = config.botName || defaults.botName || 'VANGUARD MD'
  const caption =
    '*' + videoData.title + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━\n' +
    '> _Powered by ' + botName + '_ 🔥'

  try {
    await sock.sendMessage(jid, {
      video:    { url: videoData.download },
      mimetype: 'video/mp4',
      caption,
    }, { quoted: msg })
  } catch (_) {
    try {
      const { data } = await axios.get(videoData.download, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer':    'https://www.facebook.com/',
        },
      })
      await sock.sendMessage(jid, {
        video:    Buffer.from(data),
        mimetype: 'video/mp4',
        caption,
      }, { quoted: msg })
    } catch (err) {
      await reply('❌ Failed to send video: ' + err.message)
    }
  }
}
