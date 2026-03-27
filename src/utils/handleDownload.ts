import { DownloadState } from "../types/index.js";
import runYtDlp from "./runYtDlp.js";
import { Context, InputFile } from "grammy";
import fs from "fs";
import { sendMediaGroup } from "./sendMedia.js";

export default async function handleDownload(ctx: Context, state: DownloadState) {
    const path = `tmp/${state.id}/`;
    const chaptersPath = path + "chapters/";

    const baseArgs = ["--no-playlist"];
    const singleDownloadArgs = ["-o", path + "%(title)s.%(ext)s"];
    const splitChaptersArgs = [
        "--split-chapters",
        "--paths", path,
        "-o", "chapter:chapters/%(section_title)s.%(ext)s",
    ];

    try {
        const data = await runYtDlp(["--dump-json", state.url]);
        const json = JSON.parse(data as any);

        if (!json.chapters) {
            state.splitChapters = false;
            await ctx.reply("No chapters found, sending full file");
        }

        fs.mkdirSync(path + "chapters", { recursive: true });
        
        if (state.type === "audio") {
            await runYtDlp([
                "-x",
                "--audio-format", "mp3",
                ...baseArgs,
                ...(state.splitChapters ? splitChaptersArgs : singleDownloadArgs),
                state.url
            ]);

            if (state.splitChapters) {
                await sendMediaGroup(ctx, chaptersPath, "audio");
            } else {
                const file = fs.readdirSync(path)[0];
                const filePath = path + file;
                await ctx.replyWithAudio(new InputFile(filePath));
            }
        } else if (state.type === "video") {
            await runYtDlp([
                "-f", "mp4",
                ...baseArgs,
                ...(state.splitChapters ? splitChaptersArgs : singleDownloadArgs),
                state.url
            ]);

            if (state.splitChapters) {
                await sendMediaGroup(ctx, chaptersPath, "video");
            } else {
                const file = fs.readdirSync(path)[0];
                const filePath = path + file;
                await ctx.replyWithVideo(new InputFile(filePath));
            }
        } else {
            await ctx.reply("Invalid type");
        }

        cleanupTmp(path);
    } catch (e) {
        cleanupTmp(path);
        throw e;
    }
}

function cleanupTmp(path: string) {
    if (path.startsWith("tmp/")) {
        fs.rmSync(path, { recursive: true, force: true });
    }
}