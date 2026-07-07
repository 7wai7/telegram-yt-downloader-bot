export type MediaType = "audio" | "video";

export type DownloadState = {
    id: string
    userId: number,
    url: string;
    type?: MediaType;
    splitChapters?: boolean;
    waitingForTimeRange?: boolean;
    timeRange?: {
        start: string;
        end: string;
    };
};