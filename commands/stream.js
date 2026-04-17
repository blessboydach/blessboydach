// ============================================================
//  VANGUARD MD — commands/stream.js
//  Cloud Streamer: Link to Media (Owner/Sudo Only)
// ============================================================

const axios = require('axios');
const path = require('path');

module.exports = async (ctx) => {
  const { sock, jid, msg, args, isOwner, isSudo, reply, prefix, command } = ctx;

  // 1. Security Protocol - Vanguard Power only for Admins
  if (!isOwner && !isSudo) return reply('❌ *Access Denied:* Remote streaming is restricted.');

  const url = args[0]?.trim();
  if (!url || !url.startsWith('http')) {
    return reply(
      `╭───────────────━⊷\n` +
      `┃ 🛰️ *VANGUARD STREAMER*\n` +
      `╰───────────────━⊷\n` +
      `*Usage:* \`${prefix}${command} <url>\`\n` +
      `*Example:* \`${prefix}${command} https://uguu.se/file.mp4\`\n` +
      `╰───────────────━⊷`
    );
  }

  await reply('⚡ *Establishing secure stream connection...*');

  try {
    // 2. Fetch the headers first to check file size and type
    const head = await axios.head(url);
    const contentType = head.headers['content-type'] || '';
    const contentLength = head.headers['content-length'];
    const fileName = path.basename(new URL(url).pathname) || 'vanguard_file';

    if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) { // 100MB Cap
       return reply('❌ *Limit Exceeded:* File is too large to stream (>100MB).');
    }

    // 3. Prepare the Report
    const report = 
      `╭───────────────━⊷\n` +
      `┃ 🛰️ *INCOMING STREAM*\n` +
      `╰───────────────━⊷\n` +
      `┃ 📛 *File:* ${fileName}\n` +
      `┃ 🌐 *Type:* ${contentType}\n` +
      `┃ 📊 *Size:* ${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\n` +
      `╰───────────────━⊷\n` +
      `> _VANGUARD MD is on Fire 🔥_`;

    // 4. Stream Logic
    const options = { url: url };
    const commonContext = { quoted: msg, caption: report };

    if (contentType.includes('image')) {
      await sock.sendMessage(jid, { image: options, caption: report }, { quoted: msg });
    } else if (contentType.includes('video')) {
      await sock.sendMessage(jid, { video: options, caption: report }, { quoted: msg });
    } else if (contentType.includes('audio')) {
      await sock.sendMessage(jid, { 
        audio: options, 
        mimetype: 'audio/mpeg', 
        ptt: url.includes('.mp3') ? false : true 
      }, { quoted: msg });
    } else {
      // Default to Document for anything else (.js, .apk, .zip, etc)
      await sock.sendMessage(jid, { 
        document: options, 
        fileName: fileName, 
        mimetype: contentType || 'application/octet-stream',
        caption: report
      }, { quoted: msg });
    }

  } catch (error) {
    console.error('Stream Error:', error);
    await reply(`❌ *Stream Failed:* ${error.message}\n_Ensure the link is direct and still active._`);
  }
};
