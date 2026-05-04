import ffmpeg from "fluent-ffmpeg";
import logger from "../utils/logger";
import { VideoInfo } from "../types";

export function getDuration(file: string): Promise<number> {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(file, (err, metadata) => {
            if (err || !metadata) {
                logger.error(`ffprobe failed for ${file}: ${err?.message}`);
                resolve(0);
                return;
            }
            const duration = metadata.format.duration || 0;
            resolve(duration);
        });
    });
}

export function getVideoInfo(file: string): Promise<VideoInfo | null> {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(file, (err, metadata) => {
            if (err || !metadata) {
                logger.error(`ffprobe failed for ${file}: ${err?.message}`);
                resolve(null);
                return;
            }
            
            const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
            
            if (!videoStream) {
                resolve(null);
                return;
            }
            
            resolve({
                duration: metadata.format.duration || 0,
                width: videoStream.width || 0,
                height: videoStream.height || 0,
                bitrate: parseInt(metadata.format.bit_rate || '0'),
                codec: videoStream.codec_name || 'unknown',
                size: metadata.format.size ? parseInt(metadata.format.size) : 0,
            });
        });
    });
}