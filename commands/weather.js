// ============================================================
//  VANGUARD MD — commands/weather.js
//  Global Weather Reports (Integrated)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, args, prefix, command } = ctx

  const city = args.join(' ')
  const apiKey = '4902c0f2550f58298ad4146a92b65e10'

  if (!city) {
    return reply(
      `╭───────────────━⊷\n` +
      `┃ ☁️ *VANGUARD WEATHER*\n` +
      `╰───────────────━⊷\n` +
      `*Usage:* \`${prefix}${command} <city_name>\`\n` +
      `*Example:* \`${prefix}${command} Kampala\`\n` +
      `╰───────────────━⊷`
    )
  }

  await reply(`📡 *Requesting satellite data for ${city}...*`)

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    const response = await axios.get(url)
    const w = response.data

    // ── Formatting the Report ───────────────────────────────
    const report = 
      `╭───────────────━⊷\n` +
      `┃ 🛰️ *WEATHER REPORT: ${w.name}*\n` +
      `╰───────────────━⊷\n` +
      `┃ 🌦️ *Condition:* ${w.weather[0].description}\n` +
      `┃ 🌡️ *Temp:* ${w.main.temp}°C\n` +
      `┃ 🌡️ *Feels Like:* ${w.main.feels_like}°C\n` +
      `┃ 💧 *Humidity:* ${w.main.humidity}%\n` +
      `┃ 🌬️ *Wind Speed:* ${w.wind.speed} m/s\n` +
      `┃ 🌍 *Country:* ${w.sys.country}\n` +
      `╰───────────────━⊷\n` +
      `> _VANGUARD MD Environmental Scan_`

    await reply(report)

  } catch (error) {
    console.error('Weather command error:', error)
    
    if (error.response?.status === 404) {
      return reply('❌ *Error:* City not found. Please check the spelling.')
    }
    
    await reply(`❌ *System Error:* ${error.message}`)
  }
}
