import { google } from 'googleapis';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

// 環境変数
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_URL;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Discord Client 初期化
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// OAuth2 クライアント
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

// Bot 起動
client.once('ready', () => {
    console.log('DiscordLiveDetector is online!');
});

// !live コマンド処理
client.on('messageCreate', async (message) => {
    try {
        if (message.content === '!live') {
            const res = await youtube.search.list({
                part: 'snippet',
                channelId: CHANNEL_ID,
                eventType: 'live',
                type: 'video',
                maxResults: 1
            });

            if (!res.data.items || res.data.items.length === 0) {
                message.reply('現在ライブは配信されていません。');
                return;
            }

            const liveVideo = res.data.items[0];
            const liveUrl = `https://www.youtube.com/watch?v=${liveVideo.id.videoId}`;

            // スプレッドシート更新
            const gasRes = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: liveUrl })
            });
            if (!gasRes.ok) throw new Error(`GAS update failed: ${gasRes.status}`);

            // Discord 通知
            message.reply(`限定公開ライブURL: ${liveUrl}`);
        }
    } catch (err) {
        console.error(err);
        message.reply(`CUE処理中にエラーが発生しました: ${err.message}`);
    }
});

// Bot ログイン
client.login(DISCORD_TOKEN);
