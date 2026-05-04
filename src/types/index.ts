export interface VideoInfo {
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    codec: string;
    size: number;
}

export interface ProcessResult {
    success: boolean;
    input: string;
    output: string;
    originalName: string;
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
    duration: number;
    error?: string;
}

export interface ProcessRequest {
    targetSize: number;
    unit: "B" | "KB" | "MB" | "GB";
    quality: "low" | "medium" | "high" | "veryhigh";
    preserveAudio?: boolean;
    preset?: "ultrafast" | "fast" | "medium" | "slow" | "veryslow";
}

export interface ProgressInfo {
    file: string;
    percent: number;
    speed: string;
    time: string;
    bitrate: string;
}