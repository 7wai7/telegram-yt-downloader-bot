import { DownloadState } from "../types/index.js";
import runYtDlp from "./runYtDlp.js";
import { Context, InputFile } from "grammy";
import { promises as fs } from "fs";
import { sendMediaGroup } from "./sendMedia.js";

export default async function handleDownload(ctx: Context, state: DownloadState) {
    const path = `tmp/${state.id}/`;
    const chaptersPath = path + "chapters/";

    const baseArgs = [
        "--no-playlist",
        "--remote-components", "ejs:github",
        "--js-runtimes", "node",
        "--cookies", "./keys/cookies.txt",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    ];
    
    const singleDownloadArgs = [
        "-o", path + "%(title)s.%(ext)s",
    ];

    const splitChaptersArgs = [
        "--split-chapters",
        "--paths", path,
        "-o", "chapter:chapters/%(section_title)s.%(ext)s",
    ];

    try {
        const data = await runYtDlp(["--dump-json", ...baseArgs, state.url]);
        const json = JSON.parse(data);

        if (!json.chapters) {
            state.splitChapters = false;
            await ctx.reply("No chapters found, sending full file");
        }
        
        await fs.mkdir(path + "chapters", { recursive: true });

        if (state.type === "audio") {
            await runYtDlp([
                "-x",
                "--no-simulate",
                "--audio-format", "mp3",

                "--add-metadata",
                "--embed-thumbnail",

                ...baseArgs,
                ...(state.splitChapters ? splitChaptersArgs : singleDownloadArgs),
                state.url
            ]);

            if (state.splitChapters) {
                await sendMediaGroup(ctx, chaptersPath, "audio");
            } else {
                const files = await fs.readdir(path);
                const filePath = path + files[0];
                await ctx.replyWithAudio(new InputFile(filePath));
            }
        } else if (state.type === "video") {
            await runYtDlp([
                "-f", "mp4",
                "--dump-json", "--no-simulate",
                ...baseArgs,
                ...(state.splitChapters ? splitChaptersArgs : singleDownloadArgs),
                state.url
            ]);

            if (state.splitChapters) {
                await sendMediaGroup(ctx, chaptersPath, "video");
            } else {
                const files = await fs.readdir(path);
                const filePath = path + files[0];
                await ctx.replyWithVideo(new InputFile(filePath));
            }
        } else {
            await ctx.reply("Invalid type");
        }

        cleanupTmp(path);
    } catch (e) {
        cleanupTmp(path);
        await ctx.reply("Something went wrong");
        throw e;
    }
}

async function cleanupTmp(path: string) {
    if (path.startsWith("tmp/")) {
        await fs.rm(path, { recursive: true, force: true });
    }
}