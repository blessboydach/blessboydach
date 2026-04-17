// ============================================================
//  VANGUARD MD — commands/trivia.js
//  Trivia game with 30-second timer + auto reveal
// ============================================================

const axios = require('axios');

const activeGames = new Map(); // chatId => game data

module.exports = async (ctx) => {
    const { sock, jid, msg, args, reply } = ctx;
    const command = args[0]?.toLowerCase();
    const answerLetter = args[1]?.toUpperCase();

    // ── START NEW TRIVIA ─────────────────────────────────────
    if (!command || command === 'start') {
        if (activeGames.has(jid)) {
            return reply('❌ A trivia game is already running in this chat!');
        }

        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const q = response.data.results[0];

            const options = [...q.incorrect_answers, q.correct_answer];
            // Shuffle options
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            const game = {
                question: q.question,
                correctAnswer: q.correct_answer,
                options: options,
                answerMap: {}, // letter => answer text
                startTime: Date.now()
            };

            // Map A, B, C, D to options
            const letters = ['A', 'B', 'C', 'D'];
            options.forEach((opt, i) => {
                game.answerMap[letters[i]] = opt;
            });

            activeGames.set(jid, game);

            let text = `🧠 *TRIVIA TIME!*\n\n`;
            text += `❓ ${game.question}\n\n`;
            letters.forEach(letter => {
                text += `*${letter}* ${game.answerMap[letter]}\n`;
            });
            text += `\n_You have 30 seconds to answer_\n`;
            text += `Reply with: .trivia A / B / C / D`;

            await sock.sendMessage(jid, { text }, { quoted: msg });

            // Auto reveal after 30 seconds
            setTimeout(async () => {
                if (!activeGames.has(jid)) return;

                const currentGame = activeGames.get(jid);
                await sock.sendMessage(jid, {
                    text: `⏰ *TIME UP!*\n\n` +
                          `The correct answer was:\n` +
                          `*${currentGame.correctAnswer}*`
                });

                activeGames.delete(jid);
            }, 30000);

        } catch (error) {
            console.error(error);
            await reply('❌ Failed to fetch trivia question. Try again later.');
        }
        return;
    }

    // ── SUBMIT ANSWER ────────────────────────────────────────
    if (['a', 'b', 'c', 'd'].includes(command)) {
        const game = activeGames.get(jid);

        if (!game) {
            return reply('❌ No active trivia game in this chat!');
        }

        const userAnswer = command.toUpperCase();
        const correctLetter = Object.keys(game.answerMap).find(key => 
            game.answerMap[key] === game.correctAnswer
        );

        if (userAnswer === correctLetter) {
            await reply(`✅ *Correct!* The answer is **${game.correctAnswer}**`);
        } else {
            await reply(`❌ Wrong! The correct answer was **${game.correctAnswer}**`);
        }

        // End the game
        activeGames.delete(jid);
        return;
    }

    // ── Wrong usage ──────────────────────────────────────────
    await reply(
        `🧠 *TRIVIA*\n\n` +
        `• .trivia → Start new trivia question\n` +
        `• .trivia A / B / C / D → Answer the question\n\n` +
        `_Answer within 30 seconds or it will auto-reveal_`
    );
};