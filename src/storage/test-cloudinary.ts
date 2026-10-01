import "dotenv/config";
import { uploadVideo, uploadMetadata } from "./cloudinary.js";

const videoPath = "./videos/test.mp4";

async function main() {
  const video = await uploadVideo(
    videoPath,
    "test-video"
  );

  console.log("Video URL:");
  console.log(video.secure_url);

  const metadata = {
    title: "Test Video",
    description: "Testing Cloudinary storage",
    tags: ["test", "shorts"],
    status: "READY",
  };

  const meta = await uploadMetadata(
    metadata,
    "test-video"
  );

  console.log("Metadata URL:");
  console.log(meta.secure_url);
}

main().catch((error) => {
  console.error("❌", error);
  process.exit(1);
});
