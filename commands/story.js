const axios = require('axios')

const AI_APIS = [
  (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
  (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
  (q) => `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
]

const askAI = async (query) => {
  for (const apiUrl of AI_APIS) {
    try {
      const { data } = await axios.get(apiUrl(query), { timeout: 15000 })
      const response = data?.data?.response || data?.response
      if (response && typeof response === 'string' && response.trim()) return response.trim()
    } catch (_) { continue }
  }
  throw new Error('All AI APIs failed')
}

module.exports = async (ctx) => {
  const { sock, jid, msg, reply, args } = ctx
  const userPrompt = args.join(' ').trim()

  await reply('⏳ Writing ...')

  const storyPrompt = !userPrompt
    ? 'Write a short, fun, and engaging original story. Make it interesting and creative.'
    : `Write a short, fun, and engaging story about: ${userPrompt}`

  try {
    const story = await askAI(storyPrompt)
    await sock.sendMessage(jid, {
      text: `📖 *Story Time* 📖\n\n${story}\n\n> Powered By Vanguard Md`
    }, { quoted: msg })
  } catch (error) {
    console.error('Story Error:', error.message)
    await reply('❌ Failed to generate story. Please try again later.')
  }
}
