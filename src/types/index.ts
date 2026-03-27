export type MediaType = "audio" | "video";

export type DownloadState = {
    id: string
    url: string;
    type?: MediaType;
    splitChapters?: boolean;
};