"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextReadyVideo = getNextReadyVideo;
exports.downloadVideo = downloadVideo;
exports.deleteVideo = deleteVideo;
const client_js_1 = __importDefault(require("./client.js"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
async function getNextReadyVideo() {
    console.log("☁️ Checking Cloudinary...");
    const result = await client_js_1.default.api.resources({
        type: "upload",
        resource_type: "video",
        prefix: "youtube-scheduler/pending/",
        max_results: 100,
    });
    for (const video of result.resources) {
        const sourceVideoId = video.public_id.split("/").pop();
        if (!sourceVideoId) {
            continue;
        }
        const metadataUrl = client_js_1.default.url(video.public_id, {
            resource_type: "raw",
            secure: true,
        });
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            console.log(`⚠️ Metadata not found for ${sourceVideoId}`);
            continue;
        }
        const metadata = await response.json();
        if (metadata.status !== "READY") {
            continue;
        }
        console.log(`✅ Found READY video: ${sourceVideoId}`);
        return {
            sourceVideoId,
            videoPublicId: video.public_id,
            videoUrl: video.secure_url,
            metadata,
        };
    }
    console.log("ℹ️ No READY videos found.");
    return null;
}
async function downloadVideo(video) {
    const outputDir = node_path_1.default.join(process.cwd(), "worker-data");
    node_fs_1.default.mkdirSync(outputDir, { recursive: true });
    const outputPath = node_path_1.default.join(outputDir, `${video.sourceVideoId}.mp4`);
    console.log("\n⬇️ Downloading video...");
    const response = await fetch(video.videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    node_fs_1.default.writeFileSync(outputPath, buffer);
    console.log(`✅ Video downloaded: ${outputPath}`);
    return outputPath;
}
async function deleteVideo(video) {
    console.log("\n🗑️ Deleting Cloudinary files...");
    await client_js_1.default.uploader.destroy(video.videoPublicId, {
        resource_type: "video",
        type: "upload",
    });
    await client_js_1.default.uploader.destroy(video.videoPublicId, {
        resource_type: "raw",
        type: "upload",
    });
    console.log("✅ Cloudinary video deleted");
    console.log("✅ Cloudinary metadata deleted");
}
