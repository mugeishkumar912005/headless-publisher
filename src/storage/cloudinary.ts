import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadVideo(
  filePath: string,
  publicId: string
) {
  console.log("☁️ Uploading video...");

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    public_id: `youtube-scheduler/pending/${publicId}`,
  });

  console.log("✅ Video uploaded");

  return result;
}

export async function uploadMetadata(
  metadata: object,
  publicId: string
) {
  console.log("☁️ Uploading metadata...");

  const json = JSON.stringify(metadata, null, 2);

  const result = await cloudinary.uploader.upload(
    `data:application/json;base64,${Buffer.from(json).toString("base64")}`,
    {
      resource_type: "raw",
      public_id: `youtube-scheduler/pending/${publicId}`,
    }
  );

  console.log("✅ Metadata uploaded");

  return result;
}
