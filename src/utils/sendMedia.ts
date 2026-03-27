import { Context, InputFile } from "grammy";
import fs from "fs";
import chunk from "./chunk";
import { MediaType } from "src/types";

export async function sendMediaGroup(ctx: Context, path: string, type: MediaType) {
    const files = fs.readdirSync(path);
    const chunks = chunk(files, 10);

    for (const group of chunks) {
        await ctx.replyWithMediaGroup(
            group.map(f => ({
                type,
                media: new InputFile(path + f)
            }))
        );

        await new Promise(r => setTimeout(r, 1000));
    }
}