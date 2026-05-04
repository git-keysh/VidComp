import "express-async-errors";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";
import fs from "fs";
import { PORT, NODE_ENV, PATHS } from "./config";
import logger from "./utils/logger";
import processRoute from "./routes/process";
import { getFFmpegVersion } from "./services/ffmpeg";

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP",
});
app.use("/process", limiter);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use("/videos", express.static(PATHS.uploads));
app.use("/temp", express.static(PATHS.temp));

[PATHS.uploads, PATHS.temp].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use("/process", processRoute);

app.get("/health", async (_req, res) => {
    try {
        await getFFmpegVersion();
        res.json({ status: "ok", ffmpeg: "available", timestamp: new Date().toISOString() });
    } catch (error) {
        res.json({ status: "degraded", ffmpeg: "not found", error: "Install FFmpeg on your system" });
    }
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    logger.error(err.stack || err.message);
    
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({ error: "File too large" });
            return;
        }
        res.status(400).json({ error: err.message });
        return;
    }
    
    res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

async function startServer() {
    try {
        await getFFmpegVersion();
        logger.info("✅ FFmpeg found on system");
        
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info(`📁 Upload directory: ${PATHS.uploads}`);
            logger.info(`🌍 Environment: ${NODE_ENV}`);
            logger.info("💡 Make sure FFmpeg is installed on your system");
        });
    } catch (error) {
        logger.error("❌ FFmpeg not found on system");
        logger.error("Please install FFmpeg:");
        logger.error("  - Windows: https://ffmpeg.org/download.html");
        logger.error("  - Mac: brew install ffmpeg");
        logger.error("  - Linux: sudo apt-get install ffmpeg");
        process.exit(1);
    }
}

startServer();

export default app;