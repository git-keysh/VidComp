import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import logger from "../utils/logger";
import { ProgressInfo } from "../types";

export interface FFmpegOptions {
    videoBitrate: number;
    audioBitrate: number;
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
        logger.info(`Starting FFmpeg compression: ${input} -> ${output}`);
        const command = ffmpeg(input);
        command.videoCodec('libx264');
        command.videoBitrate(Math.floor(options.videoBitrate));
        command.audioCodec('aac');
        command.audioBitrate(options.audioBitrate);
        command.addOption('-preset', options.preset);
        command.addOption('-movflags', '+faststart');
        
        if (options.scale) {
            command.size(options.scale);
        }
        
        if (options.onProgress) {
            command.on('progress', (progress) => {
                options.onProgress!({
                    file: input,
                    percent: progress.percent || 0,
                    speed: progress.currentKbps ? `${progress.currentKbps} kbps` : 'unknown',
                    time: progress.timemark,
                    bitrate: `${progress.currentKbps || 0} kbps`,
                });
            });
        }
        
        command.on('error', (err) => {
            logger.error(`FFmpeg error: ${err.message}`);
            reject(new Error(`FFmpeg failed: ${err.message}`));
        });
        
        command.on('end', () => {
            if (!fs.existsSync(output)) {
                reject(new Error('Output file not created'));
                return;
            }
            logger.info(`FFmpeg completed: ${output}`);
            resolve();
        });
        
        command.save(output);
    });
}

export function getFFmpegVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg.getAvailableCodecs((err, codecs) => {
            if (err) {
                reject(new Error('FFmpeg not found. Please install FFmpeg on your system.'));
                return;
            }
            resolve('FFmpeg is available');
        });
    });
}