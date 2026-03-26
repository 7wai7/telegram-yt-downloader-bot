import "dotenv/config"
import { Bot } from "grammy";

const bot = new Bot(process.env.TG_TOKEN!);

bot.on("message", (ctx) => {
    ctx.reply("Hi there!")
});

bot.start();