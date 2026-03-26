import { spawn } from "child_process";
import { Bot, InputFile } from "grammy";
import fs from "fs";
import "dotenv/config";

const bot = new Bot(process.env.TG_TOKEN!);

bot.on("message", async (ctx) => {
    const url = ctx.message.text;
    const file = `audio_${Date.now()}.mp3`;

    if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
        return ctx.reply("Send YouTube URL");
    }

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn("yt-dlp", [
                "-x",
                "--audio-format", "mp3",
                "--no-playlist",
                "-o", file,
                url!
            ]);

            proc.on("close", (code) => {
                if (code === 0) resolve(null);
                else reject(new Error("yt-dlp failed"));
            });
        });

        await ctx.replyWithAudio(new InputFile(file));

        fs.unlinkSync(file);
    } catch {
        ctx.reply("Error processing video");
    }
});

bot.start();