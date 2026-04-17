// ============================================================
//  VANGUARD MD — commands/vcf.js
//  Group Members → VCF Contact Exporter (LID-Compatible)
//  Creates a .vcf file with real numbers named as 💙Vang = 1 🧡 → 💙Vang = N 🧡
//  Owner / Sudo only
//  
//  ✅ Handles WhatsApp LID (Linked Identifier) format
//  ✅ Extracts clean phone numbers from concatenated identifiers
//  ✅ Validates number length and format
// ============================================================

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, isOwner, isSudo, fromGroup } = ctx

  // ── Permission check ──────────────────────────────────────
  if (!isOwner && !isSudo) {
    return reply('❌ This command is reserved for Owner and Sudo users only.')
  }

  // ── Group check ───────────────────────────────────────────
  if (!fromGroup) {
    return reply('❌ This command only works inside a WhatsApp group.\nUse it in the group you want to export.')
  }

  await reply('⏳ *Generating VCF file with real numbers…*\n_Extracting clean numbers from LID format…_')

  try {
    // ── Fetch group metadata ──────────────────────────────
    const groupMeta = await sock.groupMetadata(jid)
    let participants = groupMeta.participants || []

    if (!participants.length) {
      return reply('❌ No members found in this group.')
    }

    // ── Extract + clean numbers with LID handling ─────────
    const extracted = participants
      .map(p => {
        // Extract raw ID portion before @ symbol
        // Format can be:
        //   Standard JID: "256745626308@s.whatsapp.net"
        //   LID format:   "256745626308123456789:4@lid" (concatenated)
        let rawId = p.id.split('@')[0]  // Remove domain
        rawId = rawId.split(':')[0]      // Remove device suffix like ":4"

        return {
          id: p.id,
          rawNumber: rawId
        }
      })
      .map(p => {
        let cleanNumber = p.rawNumber

        // ── LID Handling Logic ────────────────────────────
        // LID format concatenates the phone number with linking identifiers
        // Valid international numbers: 10-15 digits (E.164 standard)
        // If we detect a number longer than 15 digits, it's LID garbage
        
        if (p.rawNumber.length > 15) {
          // Try multiple extraction strategies:
          
          // Strategy 1: Extract by common country code prefixes
          // Uganda: 256 (12 digits total)
          // Kenya: 254 (12 digits total)
          // Nigeria: 234 (13 digits total)
          // Tanzania: 255 (12 digits total)
          
          if (p.rawNumber.startsWith('256')) {
            cleanNumber = p.rawNumber.slice(0, 12)  // 256 + 9 digits
          } else if (p.rawNumber.startsWith('254')) {
            cleanNumber = p.rawNumber.slice(0, 12)  // 254 + 9 digits
          } else if (p.rawNumber.startsWith('234')) {
            cleanNumber = p.rawNumber.slice(0, 13)  // 234 + 10 digits
          } else if (p.rawNumber.startsWith('255')) {
            cleanNumber = p.rawNumber.slice(0, 12)  // 255 + 9 digits
          } else if (p.rawNumber.startsWith('233')) {
            cleanNumber = p.rawNumber.slice(0, 12)  // Ghana: 233 + 9 digits
          } else if (p.rawNumber.startsWith('27')) {
            cleanNumber = p.rawNumber.slice(0, 11)  // South Africa: 27 + 9 digits
          } else if (p.rawNumber.startsWith('1')) {
            cleanNumber = p.rawNumber.slice(0, 11)  // US/Canada: 1 + 10 digits
          } else {
            // Generic fallback: assume first 12-13 digits are valid
            cleanNumber = p.rawNumber.slice(0, 13)
          }
        }

        return {
          id: p.id,
          rawNumber: p.rawNumber,
          number: cleanNumber
        }
      })
      .filter(p => {
        // Validate: must be all digits and between 10-15 characters
        const isValid = /^\d{10,15}$/.test(p.number)
        if (!isValid) {
          console.log(`⚠️  Skipped invalid number: ${p.rawNumber} → ${p.number}`)
        }
        return isValid
      })
      .sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }))

    if (!extracted.length) {
      return reply('❌ Could not extract any valid phone numbers from this group.\n\n_All participant IDs failed validation._')
    }

    // ── Detect how many were filtered out ─────────────────
    const skippedCount = participants.length - extracted.length
    const skippedInfo = skippedCount > 0 
      ? `\n⚠️  Skipped ${skippedCount} invalid/bot number(s)`
      : ''

    // ── Build VCF content ─────────────────────────────────
    let vcfContent = ''

    extracted.forEach((member, index) => {
      const displayName = `💙Vang = ${index + 1} 🧡`
      const phoneNumber = '+' + member.number

      vcfContent += 'BEGIN:VCARD\n'
      vcfContent += 'VERSION:3.0\n'
      vcfContent += `FN:${displayName}\n`
      vcfContent += `TEL;type=CELL:${phoneNumber}\n`
      vcfContent += 'END:VCARD\n\n'
    })

    // ── Convert to buffer ─────────────────────────────────
    const buffer   = Buffer.from(vcfContent, 'utf-8')
    const safeName = (groupMeta.subject || 'Group').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'Group'
    const fileName = `${safeName}-Vang-Members.vcf`

    // ── Send VCF file ─────────────────────────────────────
    await sock.sendMessage(
      jid,
      {
        document: buffer,
        mimetype: 'text/x-vcard',
        fileName: fileName,
      },
      { quoted: msg }
    )

    // ── Success reply ─────────────────────────────────────
    return reply(
      '✅ *VCF Generated Successfully!*\n\n' +
      '📊 *Total Valid Contacts:* ' + extracted.length + '\n' +
      '📛 *Naming:* 💙Vang = 1 🧡 → 💙Vang = ' + extracted.length + ' 🧡\n' +
      '📁 *File:* ' + fileName + skippedInfo + '\n\n' +
      '_✨ LID-compatible extraction enabled_\n' +
      '_Import the file directly into your phone contacts._'
    )

  } catch (err) {
    console.error('VCF Error:', err)
    return reply('❌ Failed to generate VCF:\n`' + err.message + '`')
  }
}