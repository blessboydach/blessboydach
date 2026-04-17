// ============================================================
//  VANGUARD MD — commands/setownername.js
//  Save custom owner name (max 24 chars) → MyName in config.json
// ============================================================

const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, args, isOwner, isSudo } = ctx

  if (!isOwner && !isSudo) return reply('❌ Only owner and sudo can use this command!')

  const name = args.join(' ').trim()

  if (!name) return reply('❌ Please provide a name.\nExample: .setownername Admin Blue ')
  if (name.length > 24) return reply('❌ Name is too long!\nMaximum 24 characters allowed.')

  const configPath = path.join(__dirname, '..', 'data', 'config.json')
  let config = {}

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {}

  config.MyName = name

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  return reply(`✅ Owner name successfully set to:\n${name}`)
}