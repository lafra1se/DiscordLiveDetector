const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YT_API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GAS_URL = process.env.GAS_URL;

const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds
  ]
});

const DISCORD_TOKEN = "YOUR_DISCORD_BOT_TOKEN"; // 既存トークン
const YT_API_KEY = "YOUR_YT_API_KEY";           // YouTube APIキー
const CHANNEL_ID = "固定のYouTubeチャンネルID"; // 配信チャンネルID
const GAS_URL = "YOUR_GAS_URL";                 // GAS WebアプリURL

client.on("messageCreate", async (msg) => {
  if (msg.content === "!live") {  // コマンド名を変更
    try {
      const statuses = ["upcoming", "active"];
      let items = [];

      // 予約中・配信中のライブを取得
      for (const status of statuses) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastStatus=${status}&broadcastType=all&channelId=${CHANNEL_ID}&key=${YT_API_KEY}`
        );
        if (!res.ok) return msg.reply("YouTube APIに接続できませんでした。");

        const data = await res.json();
        if (data.items) items = items.concat(data.items);
      }

      // URLが取得できなければ通知
      if (items.length === 0) {
        return msg.reply("予約中・配信中の限定公開ライブは見つかりませんでした。");
      }

      const videoId = items[0].id;
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // GASに送信（スプレッドシート上書き）
      const gasRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!gasRes.ok) return msg.reply("スプレッドシートへの書き込みに失敗しました。");

      // Discordに通知
      msg.reply(`CUE成功: スプレッドシートにURLを書き込みました → ${url}`);

    } catch (err) {
      console.error(err);
      msg.reply("CUE処理中にエラーが発生しました。");
    }
  }
});

client.login(DISCORD_TOKEN);

