import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PATHS, LIMITS, QUALITY_PRESETS, FFMPEG_PRESETS } from "../config";
import { getDuration } from "../services/probe";
import { runFFmpeg } from "../services/ffmpeg";
import { calculateOptimalSettings, formatBitrate } from "../utils/bitrate";
import { ProcessResult, ProcessRequest } from "../types";
import logger from "../utils/logger";
import { formatFileSize, cleanupFiles } from "../services/files";

const router = Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(PATHS.uploads)) {
            fs.mkdirSync(PATHS.uploads, { recursive: true });
        }
        cb(null, PATHS.uploads);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: LIMITS.MAX_FILE_SIZE,
        files: LIMITS.MAX_FILES,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (LIMITS.ALLOWED_EXTENSIONS.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${ext}`));
        }
    },
});

router.post("/", upload.array("videos", LIMITS.MAX_FILES), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const { targetSize, unit = "MB", quality = "medium", preset = "slow" } = req.body as ProcessRequest;
    
    if (!targetSize || targetSize <= 0) {
        cleanupFiles(files.map(f => f.path));
        return res.status(400).json({ error: "Invalid target size" });
    }

    logger.info(`Processing ${files.length} files, target: ${targetSize}${unit}, quality: ${quality}`);

    const results: ProcessResult[] = [];

    for (const file of files) {
        const startTime = Date.now();
        const inputPath = file.path;
        const outputPath = `${inputPath}_compressed.mp4`;
        const originalSize = file.size;

        logger.info(`Processing: ${file.originalname} (${formatFileSize(originalSize)})`);

        try {
            const duration = await getDuration(inputPath);
            
            if (!duration || duration <= 1) {
                throw new Error("Invalid video duration");
            }

            const { videoBitrate, audioBitrate } = calculateOptimalSettings(
                Number(targetSize),
                duration,
                quality
            );

            logger.info(`  Duration: ${duration.toFixed(2)}s, Video: ${formatBitrate(videoBitrate)}, Audio: ${formatBitrate(audioBitrate)}`);

            const qualityConfig = QUALITY_PRESETS[quality as keyof typeof QUALITY_PRESETS] || QUALITY_PRESETS.medium;
            
            await runFFmpeg(inputPath, outputPath, {
                videoBitrate,
                audioBitrate,
                preset: FFMPEG_PRESETS[preset as keyof typeof FFMPEG_PRESETS] || "slow",
                scale: qualityConfig.scale,
            });

            const compressedSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
            const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;
            const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

            results.push({
                success: true,
                input: `/videos/${path.basename(inputPath)}`,
                output: `/videos/${path.basename(outputPath)}`,
                originalName: file.originalname,
                originalSize,
                compressedSize,
                reductionPercent,
                duration,
            });

            logger.info(`  ✓ Complete: ${reductionPercent.toFixed(1)}% reduction in ${timeTaken}s`);

        } catch (error) {
            logger.error(`Failed to process ${file.originalname}:`, error);
            results.push({
                success: false,
                input: `/videos/${path.basename(inputPath)}`,
                output: "",
                originalName: file.originalname,
                originalSize,
                compressedSize: 0,
                reductionPercent: 0,
                duration: 0,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return res.json({
        success: true,
        summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        },
        results,
    });
});

export default router;