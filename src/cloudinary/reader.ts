import cloudinary from "./client.js";
import fs from "node:fs";
import path from "node:path";

export type ReadyVideo = {
  sourceVideoId: string;
  videoPublicId: string;
  videoUrl: string;

  metadata: {
    sourceVideoId: string;
    sourceUrl: string;
    sourceTitle: string;
    title: string;
    description: string;
    tags: string[];
    status: string;
    createdAt: string;
  };
};

export async function getNextReadyVideo(): Promise<ReadyVideo | null> {
  console.log("☁️ Checking Cloudinary...");

  const result = await cloudinary.api.resources({
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

    const metadataUrl = cloudinary.url(video.public_id, {
      resource_type: "raw",
      secure: true,
    });

    const response = await fetch(metadataUrl);

    if (!response.ok) {
      console.log(
        `⚠️ Metadata not found for ${sourceVideoId}`
      );
      continue;
    }

    const metadata = await response.json();

    if (metadata.status !== "READY") {
      continue;
    }

    console.log(
      `✅ Found READY video: ${sourceVideoId}`
    );

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

export async function downloadVideo(
  video: ReadyVideo
): Promise<string> {
  const outputDir = path.join(
    process.cwd(),
    "worker-data"
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    `${video.sourceVideoId}.mp4`
  );

  console.log("\n⬇️ Downloading video...");

  const response = await fetch(video.videoUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download video: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  fs.writeFileSync(outputPath, buffer);

  console.log(
    `✅ Video downloaded: ${outputPath}`
  );

  return outputPath;
}
export async function deleteVideo(
  video: ReadyVideo
): Promise<void> {
  console.log("\n🗑️ Deleting Cloudinary files...");

  await cloudinary.uploader.destroy(
    video.videoPublicId,
    {
      resource_type: "video",
      type: "upload",
    }
  );

  await cloudinary.uploader.destroy(
    video.videoPublicId,
    {
      resource_type: "raw",
      type: "upload",
    }
  );

  console.log("✅ Cloudinary video deleted");
  console.log("✅ Cloudinary metadata deleted");
}