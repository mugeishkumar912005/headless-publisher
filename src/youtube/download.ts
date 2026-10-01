import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

const videosDir = path.join(process.cwd(), "videos");

export async function downloadVideo(
  url: string,
  index: number
): Promise<string> {

  fs.mkdirSync(videosDir, { recursive: true });

  const outputTemplate = path.join(
    videosDir,
    `${index}-%(id)s.%(ext)s`
  );

  console.log(`\n⬇️ Downloading: ${url}`);

  await execFileAsync("yt-dlp", [
    "-f",
    "bv*+ba/b",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    url,
  ]);

  const files = fs
    .readdirSync(videosDir)
    .filter((file) => file.startsWith(`${index}-`))
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();

      return [
        ".mp4",
        ".mkv",
        ".webm",
        ".mov",
      ].includes(ext);
    });

  if (files.length === 0) {
    throw new Error("Downloaded video file could not be found.");
  }

  const videoPath = path.join(videosDir, files[0]);

  console.log(`✅ Download complete: ${videoPath}`);

  return videoPath;
}