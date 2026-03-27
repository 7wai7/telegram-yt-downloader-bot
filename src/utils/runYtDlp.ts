import { spawn } from "child_process";

export default function runYtDlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn("yt-dlp", args);

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`yt-dlp failed (code ${code})\n${stderr}`));
            }
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}