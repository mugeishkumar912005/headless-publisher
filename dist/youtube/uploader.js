"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = uploadVideo;
const node_fs_1 = __importDefault(require("node:fs"));
const client_js_1 = __importDefault(require("./client.js"));
async function uploadVideo(videoPath, metadata) {
    console.log("\n📤 Uploading to YouTube...");
    const response = await client_js_1.default.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: "22",
            },
            status: {
                privacyStatus: "public",
            },
        },
        media: {
            body: node_fs_1.default.createReadStream(videoPath),
        },
    });
    const videoId = response.data.id;
    if (!videoId) {
        throw new Error("YouTube upload succeeded but no video ID was returned.");
    }
    console.log(`✅ YouTube upload successful: ${videoId}`);
    console.log(`🔗 https://www.youtube.com/watch?v=${videoId}`);
    return videoId;
}
