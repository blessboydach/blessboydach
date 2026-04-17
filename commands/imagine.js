const axios = require('axios')

module.exports = async (ctx) => {
  const { sock, jid, msg, reply, args } = ctx

  const prompt = args.join(' ').trim()

  if (!prompt) {
    return reply('❌ Please provide a prompt for the image.\n\nExample:\n.imagine a beautiful cyberpunk city at night')
  }

  await reply('🎨 Generating your image...\nPlease wait a moment.')

  try {
    const enhancedPrompt = enhancePrompt(prompt)

    const response = await axios.get(
      `https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`,
      { responseType: 'arraybuffer' }
    )

    const imageBuffer = Buffer.from(response.data)

    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: `✅ Generated for: "${prompt}"`
    }, { quoted: msg })

  } catch (error) {
    console.error('Imagine Error:', error.message)
    return reply('❌ Failed to generate image.\nPlease try again later.')
  }
}

function enhancePrompt(prompt) {
  const enhancers = ['high quality','detailed','masterpiece','best quality','ultra realistic','4k','highly detailed','sharp focus','cinematic lighting','professional photography']
  const num = Math.floor(Math.random() * 2) + 3
  const selected = enhancers.sort(() => Math.random() - 0.5).slice(0, num)
  return `${prompt}, ${selected.join(', ')}`
}
