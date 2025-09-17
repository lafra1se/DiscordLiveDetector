const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds
  ]
});

// 環境変数から取得
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YT_API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GAS_URL = process.env.GAS_URL;

client.on("messageCreate", async (msg) => {
  if (msg.content === "!live") {
    try {
      const statuses = ["upcoming", "active"];
      let items = [];

      for (const status of statuses) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastStatus=${status}&broadcastType=all&channelId=${CHANNEL_ID}&key=${YT_API_KEY}`
        );
        if (!res.ok) return msg.reply("YouTube APIに接続できませんでした。");

        const data = await res.json();
        if (data.items) items = items.concat(data.items);
      }

      if (items.length === 0) {
        return msg.reply("予約中・配信中の限定公開ライブは見つかりませんでした。");
      }

      const videoId = items[0].id;
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // スプレッドシート更新
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      // DiscordにURL通知
      msg.reply(`限定公開ライブURL: ${url}`);

    } catch (err) {
      console.error(err);
      msg.reply("CUE処理中にエラーが発生しました。");
    }
  }
});

client.login(DISCORD_TOKEN);
