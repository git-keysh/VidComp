import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import logger from "../utils/logger";
import { ProgressInfo } from "../types";

export const madeBy = "Made by Fav_Nonchalant";

/**
 * Auto bitrate calculator
 */
function getAutoVideoBitrate(width?: number, height?: number, duration?: number) {
    let base = 1000;

    if (width && height) {
        const pixels = width * height;

        if (pixels >= 3840 * 2160) base = 8000; // 4K
        else if (pixels >= 1920 * 1080) base = 5000; // 1080p
        else if (pixels >= 1280 * 720) base = 2500; // 720p
        else base = 1200;
    }

    if (duration && duration > 300) {
        base *= 0.85; // slightly compress long videos more
    }

    return Math.max(300, base);
}

/**
 * Auto audio bitrate
 */
function getAutoAudioBitrate() {
    return 128;
}

/**
 * Prevent insane bitrate inputs
 */
function normalizeBitrate(value: number, min: number, fallback: number) {
    if (!Number.isFinite(value) || value <= 0) return fallback;

    const kbps = value > 10000 ? Math.floor(value / 1000) : Math.floor(value);
    return Math.max(kbps, min);
}

export interface FFmpegOptions {
    videoBitrate?: number;
    audioBitrate?: number;
    preset: string;
    scale?: string;
    onProgress?: (progress: ProgressInfo) => void;
}

export function runFFmpeg(
    input: string,
    output: string,
    options: FFmpegOptions
): Promise<void> {
    return new Promise((resolve, reject) => {
        logger.info(`Starting FFmpeg: ${input} -> ${output}`);

        const command = ffmpeg(input);

        let width: number | undefined;
        let height: number | undefined;
        let duration: number | undefined;

        command.ffprobe((err, data) => {
            if (!err && data) {
                const vStream = data.streams.find(s => s.width && s.height);
                width = vStream?.width;
                height = vStream?.height;
                duration = data.format?.duration;
            }

            const videoBitrate =
                options.videoBitrate ??
                getAutoVideoBitrate(width, height, duration);

            const audioBitrate =
                options.audioBitrate ??
                getAutoAudioBitrate();

            const safeVideoBitrate = normalizeBitrate(videoBitrate, 300, 1000);
            const safeAudioBitrate = normalizeBitrate(audioBitrate, 64, 128);

            logger.info(
                `Auto settings -> Video: ${safeVideoBitrate}kbps | Audio: ${safeAudioBitrate}kbps`
            );

            command
                .videoCodec("libx264")
                .audioCodec("aac")
                .videoBitrate(safeVideoBitrate)
                .audioBitrate(safeAudioBitrate)
                .addOption("-preset", options.preset)
                .addOption("-movflags", "+faststart")
                .addOption("-pix_fmt", "yuv420p");

            if (options.scale && options.scale.includes("x")) {
                command.size(options.scale);
            }

            if (options.onProgress) {
                const progressHandler = options.onProgress;

                command.on("progress", (progress) => {
                    progressHandler({
                        file: input,
                        percent: progress.percent || 0,
                        speed: progress.currentKbps
                            ? `${progress.currentKbps} kbps`
                            : "unknown",
                        time: progress.timemark,
                        bitrate: `${progress.currentKbps || 0} kbps`,
                    });
                });
            }

            command.on("error", (err) => {
                logger.error(`FFmpeg error: ${err.message}`);
                reject(new Error(`FFmpeg failed: ${err.message}`));
            });

            command.on("end", () => {
                if (!fs.existsSync(output)) {
                    reject(new Error("Output file not created"));
                    return;
                }

                logger.info(`FFmpeg completed: ${output}`);
                resolve();
            });

            command.save(output);
        });
    });
}

export function getFFmpegVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg.getAvailableCodecs((err) => {
            if (err) {
                reject(new Error("FFmpeg not found"));
                return;
            }
            resolve("FFmpeg is available");
        });
    });
}