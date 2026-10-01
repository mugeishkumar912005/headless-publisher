import fs from "node:fs";
import youtube from "./client.js";

export type UploadMetadata = {
  title: string;
  description: string;
  tags: string[];
};

export async function uploadVideo(
  videoPath: string,
  metadata: UploadMetadata
): Promise<string> {
  console.log("\n📤 Uploading to YouTube...");

  const response = await youtube.videos.insert({
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
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = response.data.id;

  if (!videoId) {
    throw new Error(
      "YouTube upload succeeded but no video ID was returned."
    );
  }

  console.log(
    `✅ YouTube upload successful: ${videoId}`
  );

  console.log(
    `🔗 https://www.youtube.com/watch?v=${videoId}`
  );

  return videoId;
}