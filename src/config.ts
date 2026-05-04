import path from "path";
import os from "os";

export const PORT = parseInt(process.env.PORT || "1082", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";

export const PATHS = {
    uploads: path.join(process.cwd(), "uploads"),
    temp: path.join(process.cwd(), "temp"),
};

export const LIMITS = {
    MAX_FILE_SIZE: 1024 * 1024 * 1024,
    MAX_FILES: 10,
    ALLOWED_EXTENSIONS: [".mp4", ".mkv", ".mov", ".avi", ".webm", ".m4v", ".mpg", ".mpeg"],
};

export const FFMPEG_PRESETS = {
    ultrafast: "ultrafast",
    fast: "fast",
    medium: "medium",
    slow: "slow",
    veryslow: "veryslow",
} as const;

export const QUALITY_PRESETS = {
    low: { videoMultiplier: 0.7, audioBitrate: 96000, scale: "854x480" },
    medium: { videoMultiplier: 1.0, audioBitrate: 128000, scale: "1280x720" },
    high: { videoMultiplier: 1.3, audioBitrate: 192000, scale: "1920x1080" },
    veryhigh: { videoMultiplier: 1.6, audioBitrate: 320000, scale: "2560x1440" },
} as const;