// bot.js
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

// 環境変数
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YT_API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GAS_URL = process.env.GAS_URL;

// Discord Client 初期化
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Bot 起動時ログ
client.once('ready', () => {
    console.log(`DiscordLiveDetector is online!`);
});

// !live コマンドで限定公開ライブURLを取得
client.on('messageCreate', async (message) => {
    try {
        if (message.content === '!live') {
            // YouTube Data API でライブ検索
            const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${YT_API_KEY}`;
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                message.reply('現在ライブは配信されていません。');
                return;
            }

            // 最新ライブ動画を取得
            const liveVideo = data.items[0];
            const liveUrl = `https://www.youtube.com/watch?v=${liveVideo.id.videoId}`;

            // GAS に URL 上書き
            const gasRes = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: liveUrl })
            });

            if (!gasRes.ok) throw new Error(`GAS update failed: ${gasRes.status}`);

            // Discord に通知
            message.reply(`限定公開ライブURL: ${liveUrl}`);
        }
    } catch (err) {
        console.error(err);
        message.reply(`CUE処理中にエラーが発生しました: ${err.message}`);
    }
});

// Bot ログイン
client.login(DISCORD_TOKEN);
