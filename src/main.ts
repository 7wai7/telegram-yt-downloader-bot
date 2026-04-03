import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { environment } from "./config/environment.js";
import crypto from "crypto";
import http from "http";
import fs from "fs";
import { DownloadState, MediaType } from "./types/index.js";
import handleDownload from "./utils/handleDownload.js";
import { ALLOWED_USERS } from "./constants/index.js";

const cookiesPath = "./keys/cookies.txt";

if (!fs.existsSync(cookiesPath)) {
    if (!environment.YT_COOKIES_BASE64) {
        throw new Error("YT_COOKIES_BASE64 is missing");
    }

    fs.mkdirSync("./keys", { recursive: true });

    const decoded = Buffer.from(
        environment.YT_COOKIES_BASE64,
        "base64"
    ).toString("utf-8");

    fs.writeFileSync(cookiesPath, decoded);
}

const isDev = environment.NODE_ENV === "dev";
const token = isDev ? environment.TG_TOKEN_DEV : environment.TG_TOKEN;
const bot = new Bot(token);
const stateStore = new Map<string, DownloadState>();

bot.on("message", async (ctx) => {
    if (isDev && !ALLOWED_USERS.has(ctx.from.id)) return ctx.reply("Unauthorized");

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

            await ctx.editMessageText("Processing...")

            handleDownload(ctx, state)
                .finally(async () => {
                    try {
                        await ctx.deleteMessage();
                    } catch { }
                    stateStore.delete(id);
                })
        }
    } catch (e) {
        console.log(e)
        await ctx.reply("Failed to download file");
    }
});

const server = http.createServer(
  webhookCallback(bot, "https")
);

server.listen(environment.PORT, async () => {
  console.log("Server started");

  await bot.api.setWebhook(
    `${environment.WEBHOOK_URL}/webhook`
  );
});