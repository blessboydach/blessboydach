// ============================================================
//  VANGUARD MD — commands/instagram.js
//  Instagram Downloader (Post, Reel, Story, TV, etc.)
// ============================================================

const { igdl } = require("ruhend-scraper");

module.exports = async (ctx) => {
    const { sock, jid, msg, args, reply } = ctx;

    const text = args.join(" ").trim();
    if (!text) {
        return reply('❌ Please send an Instagram link!\nExample: .instagram https://instagram.com/reel/...');
    }

    // Check for valid Instagram URL
    const instagramRegex = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/.+/i;
    if (!instagramRegex.test(text)) {
        return reply('❌ Invalid Instagram link!\nPlease send a valid post, reel, or story link.');
    }

    // React with loading
    await sock.sendMessage(jid, {
        react: { text: '🔄', key: msg.key }
    });

    try {
        const data = await igdl(text);

        if (!data || !data.data || data.data.length === 0) {
            await sock.sendMessage(jid, {
                react: { text: '❌', key: msg.key }
            });
            return reply('❌ No media found! The post might be private or deleted.');
        }

        // Simple deduplication
        const seen = new Set();
        const uniqueMedia = data.data.filter(item => {
            if (!item.url || seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });

        if (uniqueMedia.length === 0) {
            await sock.sendMessage(jid, {
                react: { text: '❌', key: msg.key }
            });
            return reply('❌ Could not extract any media from this link.');
        }

        // Send all media
        for (let i = 0; i < uniqueMedia.length; i++) {
            const media = uniqueMedia[i];
            const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(media.url) || 
                           media.type === 'video' ||
                           text.includes('/reel/') ||
                           text.includes('/tv/');

            try {
                if (isVideo) {
                    await sock.sendMessage(jid, {
                        video: { url: media.url },
                        mimetype: "video/mp4",
                        caption: "_POWERED BY VANGUARD MD_"
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(jid, {
                        image: { url: media.url },
                        caption: "_POWERED BY VANGUARD MD_"
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error("Failed to send media:", e);
            }

            // Small delay to prevent flooding
            if (i < uniqueMedia.length - 1) {
                await new Promise(r => setTimeout(r, 1200));
            }
        }

        // Success reaction
        await sock.sendMessage(jid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (error) {
        console.error("Instagram command error:", error);
        await sock.sendMessage(jid, {
            react: { text: '❌', key: msg.key }
        });
        await reply('❌ Failed to download from Instagram. Please try again later.');
    }
};