import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type VideoMetadata = {
  title: string;
  description: string;
  tags: string[];
};

export async function generateMetadata(
  transcript: string,
  fileName: string
): Promise<VideoMetadata> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",

    messages: [
      {
        role: "system",
        content: `
You generate metadata for YouTube Shorts.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "title": "string",
  "description": "string",
  "tags": ["string"]
}

Rules:
- Generate 8-15 relevant YouTube tags.
- Tags should be individual keywords or short phrases.
- Include the main topic, names, concepts, and relevant search terms.
- Do not prefix tags with #.
- Do not put tags in the description.
- Make the title short and engaging.
- Do not use clickbait that is unrelated to the content.
- Write a natural YouTube Shorts description.
- Generate relevant tags.
- Do not mention that AI was used.
- Do not add markdown.
- Do not add explanations.
        `,
      },
      {
        role: "user",
        content: `
Video filename:
${fileName}

Transcript:
${transcript || "No speech was detected in the video."}

Generate the YouTube Shorts metadata.
        `,
      },
    ],

    response_format: {
      type: "json_object",
    },

    temperature: 0.7,
    max_completion_tokens: 500,
  });

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned empty metadata");
  }

  const metadata = JSON.parse(content);

  return {
    title: metadata.title || fileName,
    description: metadata.description || "",
    tags: Array.isArray(metadata.tags)
      ? metadata.tags
      : ["shorts"],
  };
}
