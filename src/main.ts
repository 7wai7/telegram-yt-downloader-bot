import { spawn } from "child_process";
import { Bot, InputFile } from "grammy";
import fs from "fs";
import { environment } from "./config/environment";

const bot = new Bot(environment.TG_TOKEN!);

bot.on("message", async (ctx) => {
    const url = ctx.message.text;
    const file = `audio_${Date.now()}.mp3`;
    const tmpPath = "tmp/" + file;

    if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
        return ctx.reply("Send YouTube URL");
    }

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn("yt-dlp", [
                "-x",
                "--audio-format", "mp3",
                "--no-playlist",
                "-o", tmpPath,
                url!
            ]);

            proc.on("close", (code) => {
                if (code === 0) resolve(null);
                else reject(new Error("Download failed"));
            });
        });

        await ctx.replyWithAudio(new InputFile(tmpPath));

        fs.unlinkSync(tmpPath);
    } catch (e) {
        console.log(e)
        await ctx.reply("Error processing video");
    }
});

bot.start();