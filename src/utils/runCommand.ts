import { spawn } from "node:child_process";

export default function runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, {
            stdio: ["ignore", "ignore", "pipe"],
        });

        let stderr = "";

        process.stderr.on("data", data => {
            stderr += data.toString();
        });

        process.on("error", reject);

        process.on("close", code => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(`${command} exited with code ${code}\n${stderr}`)
                );
            }
        });
    });
}