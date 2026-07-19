import pathModule from "node:path";
import { promises as fs } from "node:fs";
import runCommand from "./runCommand.js";

export default async function fixAudioChapterMetadata(directory: string): Promise<void> {
    const files = await fs.readdir(directory);

    for (const file of files) {
        if (!file.toLowerCase().endsWith(".mp3")) continue;

        const inputPath = pathModule.join(directory, file);
        const outputPath = pathModule.join(directory, `fixed-${file}`);

        const title = pathModule.parse(file).name;

        await runCommand("ffmpeg", [
            "-y",
            "-i", inputPath,
            "-map", "0",
            "-c", "copy",
            "-metadata", `title=${title}`,
            outputPath,
        ]);

        await fs.rename(outputPath, inputPath);
    }
}
