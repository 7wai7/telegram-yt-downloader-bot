import "dotenv/config";

export const environment = {
    PORT: process.env.PORT ?? 3000,
    NODE_ENV: process.env.NODE_ENV!,
    WEBHOOK_URL: process.env.WEBHOOK_URL!,
    TG_TOKEN: process.env.TG_TOKEN!,
    TG_TOKEN_DEV: process.env.TG_TOKEN_DEV!,
    YT_COOKIES_BASE64: process.env.YT_COOKIES_BASE64!
}