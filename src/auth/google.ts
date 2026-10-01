import "dotenv/config";
import { google } from "googleapis";
import http from "node:http";
import open from "open";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
];

export async function authenticateYouTube(): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\n🔐 Opening YouTube authorization...");
  console.log(authUrl);

  await open(authUrl);

  const redirectUrl = new URL(
    process.env.YOUTUBE_REDIRECT_URI!
  );

  const server = http.createServer(
    async (req, res) => {
      try {
        if (!req.url?.startsWith("/oauth2callback")) {
          res.writeHead(404);
          res.end();
          return;
        }

        const url = new URL(
          req.url,
          process.env.YOUTUBE_REDIRECT_URI
        );

        const code = url.searchParams.get("code");

        if (!code) {
          throw new Error(
            "Authorization code was not provided."
          );
        }

        const { tokens } =
          await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
          throw new Error(
            "No refresh token received. Run authorization again with consent."
          );
        }

        console.log("\n✅ Authorization successful!");

        console.log(
          "\nYOUTUBE_REFRESH_TOKEN="
        );
        console.log(tokens.refresh_token);

        res.writeHead(200);
        res.end(
          "Authorization successful. You can close this window."
        );

        server.close();
      } catch (error) {
        console.error(
          "\n❌ Authentication failed:",
          error
        );

        res.writeHead(500);
        res.end("Authentication failed.");

        server.close();
      }
    }
  );

  server.listen(
    Number(redirectUrl.port),
    redirectUrl.hostname,
    () => {
      console.log(
        `\n🌐 Waiting for callback on ${process.env.YOUTUBE_REDIRECT_URI}`
      );
    }
  );
}