// ============================================================
//  VANGUARD MD — commands/time.js
// ============================================================

const moment = require('moment-timezone')

// ── City → timezone map ───────────────────────────────────────
const CITIES = {
  // Africa
  nairobi:       { tz: 'Africa/Nairobi',      label: 'Nairobi, Kenya 🇰🇪' },
  kampala:       { tz: 'Africa/Kampala',      label: 'Kampala, Uganda 🇺🇬' },
  lagos:         { tz: 'Africa/Lagos',        label: 'Lagos, Nigeria 🇳🇬' },
  cairo:         { tz: 'Africa/Cairo',        label: 'Cairo, Egypt 🇪🇬' },
  johannesburg:  { tz: 'Africa/Johannesburg', label: 'Johannesburg, South Africa 🇿🇦' },
  accra:         { tz: 'Africa/Accra',        label: 'Accra, Ghana 🇬🇭' },
  dar:           { tz: 'Africa/Dar_es_Salaam',label: 'Dar es Salaam, Tanzania 🇹🇿' },
  addis:         { tz: 'Africa/Addis_Ababa',  label: 'Addis Ababa, Ethiopia 🇪🇹' },
  kigali:        { tz: 'Africa/Kigali',       label: 'Kigali, Rwanda 🇷🇼' },
  // Europe
  london:        { tz: 'Europe/London',       label: 'London, UK 🇬🇧' },
  paris:         { tz: 'Europe/Paris',        label: 'Paris, France 🇫🇷' },
  berlin:        { tz: 'Europe/Berlin',       label: 'Berlin, Germany 🇩🇪' },
  moscow:        { tz: 'Europe/Moscow',       label: 'Moscow, Russia 🇷🇺' },
  dubai:         { tz: 'Asia/Dubai',          label: 'Dubai, UAE 🇦🇪' },
  // Asia
  tokyo:         { tz: 'Asia/Tokyo',          label: 'Tokyo, Japan 🇯🇵' },
  beijing:       { tz: 'Asia/Shanghai',       label: 'Beijing, China 🇨🇳' },
  mumbai:        { tz: 'Asia/Kolkata',        label: 'Mumbai, India 🇮🇳' },
  singapore:     { tz: 'Asia/Singapore',      label: 'Singapore 🇸🇬' },
  // Americas
  newyork:       { tz: 'America/New_York',    label: 'New York, USA 🇺🇸' },
  losangeles:    { tz: 'America/Los_Angeles', label: 'Los Angeles, USA 🇺🇸' },
  saopaulo:      { tz: 'America/Sao_Paulo',   label: 'São Paulo, Brazil 🇧🇷' },
  // Australia
  sydney:        { tz: 'Australia/Sydney',    label: 'Sydney, Australia 🇦🇺' },
}

const formatTime = (tz) =>
  moment().tz(tz).format('dddd, DD MMM YYYY • hh:mm:ss A')

module.exports = async (ctx) => {
  const { reply, args } = ctx

  // ── No args — default Nairobi ─────────────────────────────
  if (!args.length) {
    const time = formatTime('Africa/Nairobi')
    return reply(
      '╭───────────────━⊷\n' +
      '┃ 🕐 *CURRENT TIME*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ 📍 *Location:* Nairobi, Kenya 🇰🇪\n' +
      '┃ 🌍 *Timezone:* Africa/Nairobi (EAT)\n' +
      '┃ ⏰ *Time:* ' + time + '\n' +
      '┃\n' +
      '┃ 💡 Try: _.time london_ or _.time tokyo_\n' +
      '╰───────────────━⊷'
    )
  }

  // ── City lookup ───────────────────────────────────────────
  const query = args.join('').toLowerCase().replace(/\s+/g, '')
  const city  = CITIES[query]

  if (!city) {
    const list = Object.keys(CITIES).join(', ')
    return reply(
      '╭───────────────━⊷\n' +
      '┃ 🕐 *CURRENT TIME*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ ❌ City not found!\n' +
      '┃\n' +
      '┃ *Supported cities:*\n' +
      '┃ ' + list + '\n' +
      '╰───────────────━⊷'
    )
  }

  const time = formatTime(city.tz)

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🕐 *CURRENT TIME*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📍 *Location:* ' + city.label + '\n' +
    '┃ 🌍 *Timezone:* ' + city.tz + '\n' +
    '┃ ⏰ *Time:* ' + time + '\n' +
    '╰───────────────━⊷'
  )
}
