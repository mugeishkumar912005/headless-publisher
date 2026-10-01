import "dotenv/config";
import { google } from "googleapis";
import { loadTokens } from "../storage/tokens.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.Google_ID,
  process.env.Google_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const tokens = loadTokens();

if (!tokens) {
  throw new Error(
    "YouTube authentication required. Run: npm run dev -- auth"
  );
}

oauth2Client.setCredentials(tokens);

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});

export type SourceVideo = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  views: number;
};

export async function getChannelId(
  handle: string
): Promise<string> {
  const cleanHandle = handle.replace(/^@/, "");

  const response = await youtube.channels.list({
    part: ["id"],
    forHandle: cleanHandle,
  });

  const channel = response.data.items?.[0];

  if (!channel?.id) {
    throw new Error(`Channel not found: @${cleanHandle}`);
  }

  return channel.id;
}

export async function getTopTwoVideos(
  channelId: string
): Promise<SourceVideo[]> {

  const channelResponse = await youtube.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });

  const uploadsPlaylist =
    channelResponse.data.items?.[0]?.contentDetails
      ?.relatedPlaylists?.uploads;

  if (!uploadsPlaylist) {
    throw new Error("Could not find uploads playlist");
  }

  const publishedAfter = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const videosResponse = await youtube.playlistItems.list({
    part: ["snippet", "contentDetails"],
    playlistId: uploadsPlaylist,
    maxResults: 50,
  });

  const recentVideos =
    videosResponse.data.items?.filter((item) => {
      const publishedAt = item.snippet?.publishedAt;

      if (!publishedAt) return false;

      return new Date(publishedAt) >= new Date(publishedAfter);
    }) ?? [];

  if (recentVideos.length === 0) {
    return [];
  }

  const videoIds = recentVideos
    .map((video) => video.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  const statsResponse = await youtube.videos.list({
    part: ["statistics", "snippet"],
    id: videoIds,
  });

  const videos: SourceVideo[] =
    statsResponse.data.items?.map((video) => ({
      id: video.id!,
      title: video.snippet?.title ?? "Untitled",
      url: `https://www.youtube.com/watch?v=${video.id}`,
      publishedAt: video.snippet?.publishedAt ?? "",
      views: Number(video.statistics?.viewCount ?? 0),
    })) ?? [];

  videos.sort((a, b) => b.views - a.views);

  return videos.slice(0, 2);
}