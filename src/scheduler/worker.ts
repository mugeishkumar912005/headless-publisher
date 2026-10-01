import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { transcribeVideo } from "../ai/transcribe.js";
import { generateMetadata } from "../ai/metadata.js";
import { uploadVideo } from "../youtube/upload.js";

const videosDir = path.join(process.cwd(), "videos");
const processedDir = path.join(videosDir, "processed");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".webm"];

const SLOTS = [
  { hour: 12, minute: 0 },
  { hour: 19, minute: 0 },
];

function getVideoFiles() {
  fs.mkdirSync(videosDir, { recursive: true });
  fs.mkdirSync(processedDir, { recursive: true });

  return fs
    .readdirSync(videosDir)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    })
    .map((file) => path.join(videosDir, file))
    .sort();
}

function getNextSlots(count: number): Date[] {
  const now = new Date();

  const slots: Date[] = [];

  for (let dayOffset = 0; slots.length < count; dayOffset++) {
    for (const slot of SLOTS) {
      const date = new Date();

      date.setDate(now.getDate() + dayOffset);
      date.setHours(slot.hour, slot.minute, 0, 0);

      if (date > now) {
        slots.push(date);

        if (slots.length === count) {
          break;
        }
      }
    }
  }

  return slots;
}

async function processVideo(
  videoPath: string,
  publishAt: Date
) {
  console.log(`\n🎬 Processing: ${path.basename(videoPath)}`);

  console.log("🎙️ Transcribing...");
  const transcript = await transcribeVideo(videoPath);

  console.log("🤖 Generating metadata...");
  const metadata = await generateMetadata(
    transcript,
    path.basename(videoPath)
  );

  console.log("\nGenerated metadata:");
  console.log(JSON.stringify(metadata, null, 2));

  console.log(
    `\n📅 Scheduling for ${publishAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`
  );

  await uploadVideo(
    videoPath,
    metadata,
    publishAt
  );

  const destination = path.join(
    processedDir,
    path.basename(videoPath)
  );

  fs.renameSync(videoPath, destination);

  console.log(`📦 Moved to processed/`);
}

async function main() {
  console.log("\n🤖 Headless Scheduler Worker");
  console.log("============================");

  const videos = getVideoFiles();

  if (videos.length === 0) {
    console.log("📂 No videos waiting.");
    return;
  }

  console.log(`📂 ${videos.length} video(s) waiting.`);

  const slots = getNextSlots(videos.length);

  for (let i = 0; i < videos.length; i++) {
    await processVideo(videos[i], slots[i]);
  }

  console.log("\n✅ Worker finished.");
}

main().catch((error) => {
  console.error("\n❌ Worker failed:");
  console.error(error);
  process.exit(1);
});
