import fs from "fs";
import path from "path";
import { LIMITS } from "../config";

export function getVideos(folder: string): string[] {
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder)
        .filter(f => LIMITS.ALLOWED_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
        .map(f => path.join(folder, f));
}

export function getFileSize(filePath: string): number {
    try {
        return fs.statSync(filePath).size;
    } catch {
        return 0;
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function cleanupFiles(files: string[]): void {
    for (const file of files) {
        try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch (err) {
            console.error(`Failed to cleanup ${file}:`, err);
        }
    }
}