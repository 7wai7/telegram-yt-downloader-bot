import { Bot, InputFile } from "grammy";
import fs from "fs";
import { environment } from "./config/environment";
import { InlineKeyboard } from "grammy";
import runYtDlp from "./utils/runYtDlp";
import crypto from "crypto";

const bot = new Bot(environment.TG_TOKEN);
const urlStore = new Map<string, string>();

bot.on("message", async (ctx) => {
    try {
        const url = ctx.message.text;

        if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
            return ctx.reply("Send YouTube URL");
        }

        const urlId = crypto.randomUUID();

        const keyboard = new InlineKeyboard()
            .text("Audio", `audio|${urlId}`)
            .text("Video", `video|${urlId}`);

        urlStore.set(urlId, url);

        await ctx.reply("What do you want to download?", {
            reply_markup: keyboard
        });
    } catch (e) {
        console.log(e)
        await ctx.reply("Error");
    }
});

bot.on("callback_query:data", async (ctx) => {
    const [type, urlId] = ctx.update.callback_query.data.split("|");
    const url = urlStore.get(urlId);

    if(!url) return ctx.reply("URL not found. Try to send again");
    urlStore.delete(urlId);

    // await ctx.answerCallbackQuery();

    const file = `${type}_${Date.now()}`;
    const tmpPath = `tmp/${file}`;

    try {
        if (type === "audio") {
            await runYtDlp([
                "-x",
                "--audio-format", "mp3",
                "--no-playlist",
                "-o", tmpPath + ".mp3",
                url
            ]);

            await ctx.replyWithAudio(new InputFile(tmpPath + ".mp3"));
            fs.unlinkSync(tmpPath + ".mp3");
        } else if (type === "video") {
            await runYtDlp([
                "-f", "mp4",
                "--no-playlist",
                "-o", tmpPath + ".mp4",
                url
            ]);

            await ctx.replyWithVideo(new InputFile(tmpPath + ".mp4"));
            fs.unlinkSync(tmpPath + ".mp4");
        } else {
            await ctx.reply("Invalid type");
        }

    } catch (e) {
        console.error(e);
        await ctx.reply("Error processing video");
    }
});

bot.start();