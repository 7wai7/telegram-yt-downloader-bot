import { Context, InputFile } from "grammy";
import fs from "fs";
import chunk from "./chunk.js";
import { MediaType } from "../types/index.js";

export async function sendMediaGroup(ctx: Context, path: string, type: MediaType) {
    const files = fs.readdirSync(path);
    const chunks = chunk(files, 10);

    for (const group of chunks) {
        try {
            await ctx.replyWithMediaGroup(
                group.map(f => ({
                    type,
                    media: new InputFile(path + f)
                }))
            );
        } catch (err: any) {
            console.error("MediaGroup failed, fallback to single:", err.message);
            for (const f of group) {
                await sendSingleSafe(ctx, path + f, type);
            }
        }

        await new Promise(r => setTimeout(r, 500));
    }
}


export async function sendSingleSafe(ctx: Context, filePath: string, type: MediaType) {
    try {
        if (type === "audio") {
            await ctx.replyWithAudio(new InputFile(filePath));
        } else if (type === "video") {
            await ctx.replyWithVideo(new InputFile(filePath));
        }
    } catch (err: any) {
        console.error(`Failed to send file: ${filePath}`, err.message);

        await ctx.reply(`Failed to send file:\n${filePath.split("/").pop()}`);
    }
}