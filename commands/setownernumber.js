const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, args, isOwner, isSudo } = ctx

  if (!isOwner && !isSudo) return reply('❌ Only owner and sudo can use this command!')

  let input = args.join(' ').trim()
  if (!input) return reply('❌ Please provide a number.\nExample: .setownernumber +256746223422')

  let number = input.replace(/[^0-9+]/g, '')

  if (!number) return reply('❌ Invalid number!\nOnly digits and + allowed, maximum 20 characters.')

  if (!number.startsWith('+')) number = '+' + number

  if (number.length > 21 || !/^\+\d{1,20}$/.test(number)) {
    return reply('❌ Invalid number!\nOnly digits and + allowed, maximum 20 characters.')
  }

  const configPath = path.join(__dirname, '..', 'data', 'config.json')
  let config = {}

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {}

  config.MyNum = number
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  return reply(`✅ Owner number successfully set to:\n${number}`)
}
