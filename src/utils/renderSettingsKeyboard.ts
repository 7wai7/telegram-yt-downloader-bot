import { InlineKeyboard } from "grammy";
import { DownloadState } from "../types/index.js";

export default function renderSettingsKeyboard(state: DownloadState) {
    const timeRange = state.timeRange
        ? `${state.timeRange.start}-${state.timeRange.end}`
        : "full";

    return {
        text:
            `Settings:\n\n` +
            `Type: ${state.type}\n` +
            `Split chapters: ${state.splitChapters ? "ON" : "OFF"}\n` +
            `Time range: ${timeRange}`,
        keyboard: new InlineKeyboard()
            .text(state.type === "audio" ? "✓ Audio" : "Audio", `set_type|audio|${state.id}`)
            .text(state.type === "video" ? "✓ Video" : "Video", `set_type|video|${state.id}`)
            .row()
            .text(state.splitChapters ? "✓ Split ON" : "Split ON", `set_split|true|${state.id}`)
            .text(!state.splitChapters ? "✓ Split OFF" : "Split OFF", `set_split|false|${state.id}`)
            .row()
            .text("Set time range", `set_range|${state.id}`)
            .text("Full", `set_range_full|${state.id}`)
            .row()
            .text("Download", `download|${state.id}`),
    };
}