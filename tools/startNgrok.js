import dotenv from "dotenv";
import { spawn } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";

dotenv.config();

const token = process.env.NGROK_TOKEN;

if (!token) {
    throw new Error("NGROK_TOKEN is missing");
}

const configPath = path.join(
    os.tmpdir(),
    `telegram-bot-ngrok-${crypto.randomUUID()}.yml`
);

await writeFile(
    configPath,
    `version: "3"
agent:
  authtoken: ${JSON.stringify(token)}
`,
    { mode: 0o600 }
);

const ngrok = spawn(
    "ngrok",
    [
        "http",
        "--config",
        configPath,
        "--url",
        "uncourageous-marleen-unintensified.ngrok-free.dev",
        "8000",
    ],
    {
        stdio: "inherit",
    }
);

const cleanup = async () => {
    await rm(configPath, { force: true });
};

ngrok.on("exit", async (code) => {
    await cleanup();
    process.exit(code ?? 0);
});

process.on("SIGINT", () => ngrok.kill("SIGINT"));
process.on("SIGTERM", () => ngrok.kill("SIGTERM"));