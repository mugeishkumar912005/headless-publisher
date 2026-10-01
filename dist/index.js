"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const reader_js_1 = require("./cloudinary/reader.js");
const uploader_js_1 = require("./youtube/uploader.js");
async function main() {
    console.log("🚀 Headless Publisher\n");
    // 1. Find next READY video
    const video = await (0, reader_js_1.getNextReadyVideo)();
    if (!video) {
        console.log("❌ No READY videos found.");
        return;
    }
    // 2. Show metadata
    console.log("\n📋 Video metadata:");
    console.log(JSON.stringify(video.metadata, null, 2));
    // 3. Download video from Cloudinary
    const videoPath = await (0, reader_js_1.downloadVideo)(video);
    console.log("\n📁 Downloaded:");
    console.log(videoPath);
    // 4. Upload directly to YouTube as PUBLIC
    const youtubeVideoId = await (0, uploader_js_1.uploadVideo)(videoPath, {
        title: video.metadata.title,
        description: video.metadata.description,
        tags: video.metadata.tags,
    });
    // 5. YouTube upload succeeded
    //    Now delete Cloudinary files
    await (0, reader_js_1.deleteVideo)(video);
    // 6. Delete local temporary video
    if (node_fs_1.default.existsSync(videoPath)) {
        node_fs_1.default.unlinkSync(videoPath);
        console.log("✅ Local video deleted");
    }
    console.log(`\n🎉 Published successfully: ${youtubeVideoId}`);
}
main().catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
});
