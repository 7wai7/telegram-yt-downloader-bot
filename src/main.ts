import { Bot, webhookCallback } from "grammy";
import { environment } from "./config/environment.js";
import crypto from "crypto";
import http from "http";
import fs from "fs";
import { DownloadState, MediaType } from "./types/index.js";
import handleDownload from "./utils/handleDownload.js";
import { ALLOWED_USERS } from "./constants/index.js";
import renderSettingsKeyboard from "./utils/renderSettingsKeyboard.js";

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
const port = environment.PORT;
const bot = new Bot(token);
const stateStore = new Map<string, DownloadState>();

bot.on("message", async (ctx) => {
    if (isDev && !ALLOWED_USERS.has(ctx.from.id)) {
        return ctx.reply("Unauthorized");
    }

    try {
        const text = ctx.message.text?.trim();

        const pending = [...stateStore.values()].find(
            s => s.waitingForTimeRange && s.userId === ctx.from.id
        );

        if (pending) {
            if (!text) return ctx.reply("Send time range");

            const match = text.match(
                /^(\d{1,2}:)?\d{1,2}:\d{2}\s*-\s*(\d{1,2}:)?\d{1,2}:\d{2}$/
            );

            if (!match) {
                return ctx.reply("Invalid format. Example: 2:33-50:13");
            }

            const [start, end] = text.split("-").map(v => v.trim());

            pending.timeRange = { start, end };
            pending.waitingForTimeRange = false;

            const view = renderSettingsKeyboard(pending);

            await ctx.reply(view.text, {
                reply_markup: view.keyboard,
            });

            return;
        }

        if (!text?.includes("youtube.com") && !text?.includes("youtu.be")) {
            return ctx.reply("Send YouTube URL");
        }

        const id = crypto.randomUUID();

        const state: DownloadState = {
            id,
            url: text,
            userId: ctx.from.id,
            type: "audio",
            splitChapters: false,
        };

        stateStore.set(id, state);

        const view = renderSettingsKeyboard(state);

        await ctx.reply(view.text, {
            reply_markup: view.keyboard,
        });
    } catch (e) {
        console.error(e);

        try {
            await ctx.reply("Error");
        } catch { }
    }
});

bot.on("callback_query:data", async (ctx) => {
    try {
        const parts = ctx.callbackQuery.data.split("|");
        const action = parts[0];
        const id = parts.pop()!;

        const state = stateStore.get(id);
        if (!state) return ctx.reply("State expired");

        await ctx.answerCallbackQuery();

        if (action === "set_type") {
            const [, type] = parts;

            if (state.type === type) {
                return;
            }

            state.type = type as MediaType;

            const view = renderSettingsKeyboard(state);

            await ctx.editMessageText(view.text, {
                reply_markup: view.keyboard,
            });

            return;
        }

        if (action === "set_split") {
            const [, split] = parts;

            const nextValue = split === "true";

            if (state.splitChapters === nextValue) {
                return;
            }

            state.splitChapters = nextValue;

            const view = renderSettingsKeyboard(state);

            await ctx.editMessageText(view.text, {
                reply_markup: view.keyboard,
            });

            return;
        }

        if (action === "set_range") {
            state.waitingForTimeRange = true;

            await ctx.reply("Send time range. Example: 2:33-50:13");

            return;
        }

        if (action === "set_range_full") {
            if (!state.timeRange && !state.waitingForTimeRange) {
                return;
            }

            state.timeRange = undefined;
            state.waitingForTimeRange = false;

            const view = renderSettingsKeyboard(state);

            await ctx.editMessageText(view.text, {
                reply_markup: view.keyboard,
            });

            return;
        }

        if (action === "download") {
            await ctx.editMessageText("Processing...");

            void handleDownload(ctx, state)
                .catch(async (e) => {
                    console.error(e);

                    try {
                        await ctx.reply("Failed to download file");
                    } catch { }
                })
                .finally(async () => {
                    stateStore.delete(id);
                });

            return;
        }
    } catch (e) {
        console.error(e);

        try {
            await ctx.reply("Failed");
        } catch { }
    }
});

const server = http.createServer((req, res) => {
    try {
        if (req.url === "/webhook") {
            return webhookCallback(bot, "http")(req, res);
        }

        res.statusCode = 200;
        res.end("OK");
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end();
    }
});

server.listen(
    {
        port,
        host: "0.0.0.0",
    },
    () => {
        console.log(`Server started on port ${port}`);

        bot.api.setWebhook(`${environment.WEBHOOK_URL}/webhook`)
            .catch(console.error);
    }
);

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});