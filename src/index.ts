import fs from "node:fs";

import {
  getNextReadyVideo,
  downloadVideo,
  deleteVideo,
} from "./cloudinary/reader.js";

import { uploadVideo } from "./youtube/uploader.js";

async function main() {
  console.log("🚀 Headless Publisher\n");

  // 1. Find next READY video
  const video = await getNextReadyVideo();

  if (!video) {
    console.log("❌ No READY videos found.");
    return;
  }

  // 2. Show metadata
  console.log("\n📋 Video metadata:");

  console.log(
    JSON.stringify(video.metadata, null, 2)
  );

  // 3. Download video from Cloudinary
  const videoPath = await downloadVideo(video);

  console.log("\n📁 Downloaded:");
  console.log(videoPath);

  // 4. Upload directly to YouTube as PUBLIC
  const youtubeVideoId = await uploadVideo(
    videoPath,
    {
      title: video.metadata.title,
      description: video.metadata.description,
      tags: video.metadata.tags,
    }
  );

  // 5. YouTube upload succeeded
  //    Now delete Cloudinary files
  await deleteVideo(video);

  // 6. Delete local temporary video
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
    console.log("✅ Local video deleted");
  }

  console.log(
    `\n🎉 Published successfully: ${youtubeVideoId}`
  );
}

main().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});