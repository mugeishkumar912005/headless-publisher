import "dotenv/config";

import { authenticateYouTube } from "./auth/google.js";
import { getChannelId, getTopTwoVideos } from "./youtube/discover.js";
import { downloadVideo } from "./youtube/download.js";
import { transcribeVideo } from "./ai/transcribe.js";
import { generateMetadata } from "./ai/metadata.js";
import {
  uploadVideo,
  uploadMetadata,
} from "./storage/cloudinary.js";

const command = process.argv[2];

async function processChannel() {
  const handle = process.argv[3];

  if (!handle) {
    throw new Error(
      "Usage: npm run dev -- process @channelhandle"
    );
  }

  console.log(`\n🔎 Channel: ${handle}`);

  // 1. Channel ID
  const channelId = await getChannelId(handle);

  console.log(`✅ Channel ID: ${channelId}`);

  // 2. Find top 2
  console.log("\n📅 Finding top 2 videos from last 7 days...");

  const videos = await getTopTwoVideos(channelId);

  if (videos.length === 0) {
    console.log("❌ No videos found.");
    return;
  }

  videos.forEach((video, index) => {
    console.log(
      `${index + 1}. ${video.title} — ${video.views.toLocaleString()} views`
    );
  });

  // 3. Process each video
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    console.log(
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );
    console.log(`🎬 Processing ${i + 1}/${videos.length}`);
    console.log(`📺 ${video.title}`);

    // Download
    const videoPath = await downloadVideo(
      video.url,
      i + 1
    );

    // Transcribe
    console.log("\n🎙️ Transcribing...");

    const transcript = await transcribeVideo(videoPath);

    // Generate metadata
    console.log("\n🤖 Generating metadata...");

    const metadata = await generateMetadata(
      transcript,
      video.title
    );

    console.log("\n📝 Metadata:");
    console.log(JSON.stringify(metadata, null, 2));

    // Cloudinary
    console.log("\n☁️ Uploading to Cloudinary...");

    await uploadVideo(
      videoPath,
      video.id
    );

    await uploadMetadata(
      {
        sourceVideoId: video.id,
        sourceUrl: video.url,
        sourceTitle: video.title,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        status: "READY",
        createdAt: new Date().toISOString(),
      },
      video.id
    );

    console.log("✅ Video + metadata stored in Cloudinary");
  }

  console.log("\n🎉 Service 1 completed successfully.");
}

async function main() {
  switch (command) {
    case "auth":
      await authenticateYouTube();
      break;

    case "process":
      await processChannel();
      break;

    default:
      console.log(`
🎬 Headless Scheduler

Commands:

  npm run dev -- auth
      Connect YouTube (one-time)

  npm run dev -- process @channelhandle
      Download → Groq → Cloudinary
`);
  }
}

main().catch((error) => {
  console.error("\n❌", error);
  process.exit(1);
});