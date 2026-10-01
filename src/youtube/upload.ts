import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";
import { loadTokens } from "../storage/tokens.js";
import type { VideoMetadata } from "../ai/metadata.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.Google_ID,
  process.env.Google_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const tokens = loadTokens();

if (!tokens) {
  throw new Error("YouTube authentication required.");
}

oauth2Client.setCredentials(tokens);

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});

export async function uploadVideo(
  videoPath: string,
  metadata: VideoMetadata,
  publishAt: Date
) {
  console.log(`⬆️ Uploading ${videoPath}...`);

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
        privacyStatus: "private",
        publishAt: publishAt.toISOString(),
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = response.data.id;

  if (!videoId) {
    throw new Error("YouTube upload failed: no video ID returned");
  }

  console.log(`✅ Uploaded: https://www.youtube.com/watch?v=${videoId}`);
  console.log(`🕐 Scheduled: ${publishAt.toLocaleString()}`);

  return videoId;
}
