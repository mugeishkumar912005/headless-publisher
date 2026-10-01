import "dotenv/config";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Groq from "groq-sdk";

const execFileAsync = promisify(execFile);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = `${videoPath}.mp3`;

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "64k",
    audioPath,
  ]);

  return audioPath;
}

export async function transcribeVideo(
  videoPath: string
): Promise<string> {
  console.log("Extracting audio...");

  const audioPath = await extractAudio(videoPath);

  try {
    console.log("Sending audio to Groq Whisper...");

    const transcription =
      await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-large-v3-turbo",
        response_format: "json",
      });

    return transcription.text || "";
  } finally {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
}
