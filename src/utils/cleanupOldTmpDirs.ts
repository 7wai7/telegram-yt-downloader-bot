import path from "node:path";
import { promises as fs } from "node:fs";

const DEFAULT_TMP_DIR = "tmp";
const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_MAX_AGE_MS = 24 * ONE_HOUR_MS;
const DEFAULT_INTERVAL_MS = ONE_HOUR_MS;

type CleanupOptions = {
    tmpDir?: string;
    maxAgeMs?: number;
};

type ScheduleCleanupOptions = CleanupOptions & {
    intervalMs?: number;
};

export async function cleanupOldTmpDirs(options: CleanupOptions = {}) {
    const tmpDir = path.resolve(options.tmpDir ?? DEFAULT_TMP_DIR);
    const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    const cutoff = Date.now() - maxAgeMs;

    await fs.mkdir(tmpDir, { recursive: true });

    const entries = await fs.readdir(tmpDir, { withFileTypes: true });
    let removedCount = 0;

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const entryPath = path.join(tmpDir, entry.name);
        const newestMtimeMs = await getNewestMtimeMs(entryPath);

        if (newestMtimeMs > cutoff) {
            continue;
        }

        await fs.rm(entryPath, { recursive: true, force: true });
        removedCount += 1;
    }

    return removedCount;
}

export function scheduleOldTmpDirsCleanup(options: ScheduleCleanupOptions = {}) {
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

    void runCleanup(options);

    const timer = setInterval(() => {
        void runCleanup(options);
    }, intervalMs);

    timer.unref();

    return timer;
}

async function runCleanup(options: CleanupOptions) {
    try {
        const removedCount = await cleanupOldTmpDirs(options);

        if (removedCount > 0) {
            console.log(`Removed old tmp dirs: ${removedCount}`);
        }
    } catch (e) {
        console.error("Failed to cleanup old tmp dirs:", e);
    }
}

async function getNewestMtimeMs(targetPath: string): Promise<number> {
    const stats = await fs.lstat(targetPath);
    let newestMtimeMs = stats.mtimeMs;

    if (!stats.isDirectory() || stats.isSymbolicLink()) {
        return newestMtimeMs;
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(targetPath, entry.name);
        const entryMtimeMs = await getNewestMtimeMs(entryPath);

        newestMtimeMs = Math.max(newestMtimeMs, entryMtimeMs);
    }

    return newestMtimeMs;
}
