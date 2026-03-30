import { Bot } from "grammy";
import { environment } from "./config/environment.js";
import { InlineKeyboard } from "grammy";
import crypto from "crypto";
import { writeFileSync } from "fs";
import { DownloadState, MediaType } from "./types/index.js";
import handleDownload from "./utils/handleDownload.js";

writeFileSync("./keys/cookies.txt", environment.YT_COOKIES);

const bot = new Bot(environment.TG_TOKEN);
const stateStore = new Map<string, DownloadState>();

bot.on("message", async (ctx) => {
    try {
        const url = ctx.message.text;

        if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
            return ctx.reply("Send YouTube URL");
        }

        const id = crypto.randomUUID();

        stateStore.set(id, { id, url });

        const keyboard = new InlineKeyboard()
            .text("🎧 Audio", `type|audio|${id}`)
            .text("🎥 Video", `type|video|${id}`);

        await ctx.reply("Choose format:", { reply_markup: keyboard });
    } catch (e) {
        console.log(e)
        await ctx.reply("Error");
    }
});

bot.on("callback_query:data", async (ctx) => {
    try {
        const parts = ctx.callbackQuery.data.split("|");

        const action = parts[0];

        if (action === "type") {
            const [, type, id] = parts;

            const state = stateStore.get(id);
            if (!state) return ctx.reply("Expired. Try to send url again");

            state.type = type as MediaType;

            const keyboard = new InlineKeyboard()
                .text("ON", `split|true|${id}`)
                .text("OFF", `split|false|${id}`);

            await ctx.editMessageText("Split chapters?", {
                reply_markup: keyboard
            });
        } else if (action === "split") {
            const [, split, id] = parts;

            const state = stateStore.get(id);
            if (!state) return ctx.reply("Expired");

            state.splitChapters = split === "true";

            await ctx.editMessageText("Processing...");

            await handleDownload(ctx, state);

            await ctx.deleteMessage();

            stateStore.delete(id);
        }
    } catch (e) {
        console.log(e)
        await ctx.reply("Failed to download file");
    }
});

bot.start();