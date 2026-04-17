const axios = require('axios')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { uploadImage } = require('../lib/uploadImage')

async function getImageUrl(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    return await uploadImage(buffer)
  }
  if (message.message?.imageMessage) {
    const stream = await downloadContentFromMessage(message.message.imageMessage, 'image')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    return await uploadImage(buffer)
  }
  return null
}

module.exports = async (ctx) => {
  const { sock, jid, msg, reply, args } = ctx
  let imageUrl = null

  if (args.length > 0) {
    const url = args.join(' ').trim()
    if (url.startsWith('http')) imageUrl = url
    else return reply('❌ Invalid URL!\n\nUsage: `.remini https://example.com/image.jpg`')
  } else {
    await reply('📸 Processing image...')
    imageUrl = await getImageUrl(sock, msg)
    if (!imageUrl) return reply('📸 *Remini AI Enhancement*\n\nReply to an image or send one with `.remini`')
  }

  await reply('✨ Enhancing image with Remini AI...\nPlease wait.')

  try {
    const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`
    const response = await axios.get(apiUrl, { timeout: 60000 })

    if (!response.data?.success || !response.data?.result?.image_url) throw new Error('API failed')

    const enhancedUrl = response.data.result.image_url
    const imageRes = await axios.get(enhancedUrl, { responseType: 'arraybuffer', timeout: 30000 })

    await sock.sendMessage(jid, {
      image: imageRes.data,
      caption: '✨ *Image Enhanced Successfully!*\n\n𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗔𝗡𝗚𝗨𝗔𝗥𝗗 𝗠𝗗 🔥'
    }, { quoted: msg })

  } catch (error) {
    console.error('Remini Error:', error.message)
    await reply('❌ Failed to enhance image. Please try again later.')
  }
}
