import { spawn } from "child_process";

export default function runYtDlp(args: string[]) {
    return new Promise((resolve, reject) => {
        const proc = spawn("yt-dlp", args);

        proc.on("close", (code) => {
            if (code === 0) resolve(null);
            else reject(new Error("yt-dlp failed"));
        });
    });
}