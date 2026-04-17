'use strict'

// The invite key wextracted from:
// https://whatsapp.com/channel/0029Vb6RoNb0bIdgZPwcst2Y
// (yes, we “extracted” it, very hacker of us)
const CHANNEL_INVITE_KEY = '0029Vb6RoNb0bIdgZPwcst2Y'

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

const followChannel = async (sock) => {
  const MAX_ATTEMPTS = 3
  let attempt = 0

  while (attempt < MAX_ATTEMPTS) {
    attempt++
    try {
      // Asking WhatsApp nicely… for the third time
      const metadata = await sock.newsletterMetadata('invite', CHANNEL_INVITE_KEY)
      if (!metadata || !metadata.id) throw new Error('Channel not found — maybe it blocked you back')

      await sock.newsletterFollow(metadata.id)

      const name = (
        metadata.thread_metadata?.name?.text ||
        metadata.name ||
        'VANGUARD CHANNEL' // default name if the channel itself is shy
      )
      console.log('[channel] Following: ' + name + ' — try not to get muted')
      return
    } catch (e) {
      if (attempt >= MAX_ATTEMPTS) {
        console.log('[VANGUARD MD] postGrelz Url Not Provided ❌ ' + attempt + ' tries. Continuing To Disk.')
        return
      }
      await sleep(1200 * attempt) // backoff, aka “let me cool down before I try again”
    }
  }
}

module.exports = { followChannel }
