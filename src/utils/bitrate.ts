export type Unit = "B" | "KB" | "MB" | "GB";

export function toBytes(size: number, unit: Unit): number {
    const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    return size * multipliers[unit];
}

export function calcBitrate(bytes: number, durationSeconds: number): number {
    if (durationSeconds <= 0) throw new Error("Invalid duration");
    // Total bits = bytes * 8, bitrate = total bits / duration
    return Math.floor((bytes * 8) / durationSeconds);
}

export function formatBitrate(bitrate: number): string {
    if (bitrate > 1_000_000) return `${(bitrate / 1_000_000).toFixed(2)} Mbps`;
    if (bitrate > 1_000) return `${(bitrate / 1_000).toFixed(2)} Kbps`;
    return `${bitrate} bps`;
}

export function calculateOptimalSettings(
    targetSizeMB: number,
    durationSeconds: number,
    quality: string
): { videoBitrate: number; audioBitrate: number } {
    const targetBytes = targetSizeMB * 1024 * 1024;
    let totalBitrate = calcBitrate(targetBytes, durationSeconds);
    
    // Reserve 10-15% for audio and container overhead
    let audioBitrate = Math.min(320000, Math.max(64000, Math.floor(totalBitrate * 0.1)));
    let videoBitrate = totalBitrate - audioBitrate;
    
    // Quality adjustments
    switch (quality) {
        case "high":
            videoBitrate = Math.floor(videoBitrate * 1.3);
            audioBitrate = 192000;
            break;
        case "veryhigh":
            videoBitrate = Math.floor(videoBitrate * 1.6);
            audioBitrate = 320000;
            break;
        case "low":
            videoBitrate = Math.floor(videoBitrate * 0.7);
            audioBitrate = 96000;
            break;
    }
    
    // Sanity checks
    const MIN_VIDEO_BITRATE = 50000; // 50 Kbps minimum
    const MAX_VIDEO_BITRATE = 50000000; // 50 Mbps maximum
    const MIN_AUDIO_BITRATE = 32000;
    const MAX_AUDIO_BITRATE = 512000;
    
    videoBitrate = Math.min(MAX_VIDEO_BITRATE, Math.max(MIN_VIDEO_BITRATE, videoBitrate));
    audioBitrate = Math.min(MAX_AUDIO_BITRATE, Math.max(MIN_AUDIO_BITRATE, audioBitrate));
    
    return { videoBitrate, audioBitrate };
}