import "dotenv/config";
import http from "node:http";
import { google } from "googleapis";
import open from "open";
import { saveTokens } from "../storage/tokens.js";

const PORT = 53682;
console.log("step1")
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);


console.log("oauth2Client:", oauth2Client);
console.log("step2")
const scopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly"
];

export async function authenticateYouTube() {
  console.log("step3")
  const state = crypto.randomUUID();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });
  console.log("authUrl:", authUrl);
  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/oauth2callback")) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    
    const url = new URL(
      req.url,
      `http://localhost:${PORT}`
    );
    console.log("url:", url);

    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("code:", code);
    console.log("state:", state);
    console.log("returnedState:", returnedState);

    if (error) {
      res.writeHead(400);
      res.end(`Google OAuth failed: ${error}`);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400);
      res.end("Authorization code missing");
      server.close();
      return;
    }

    if (returnedState !== state) {
      res.writeHead(400);
      res.end("Invalid OAuth state");
      server.close();
      return;
    }

    try {
      const { tokens } =
        await oauth2Client.getToken(code);

      saveTokens(tokens);

      res.writeHead(200, {
        "Content-Type": "text/html",
      });

      res.end(`
        <html>
          <body>
            <h2>YouTube authorization successful ✅</h2>
            <p>You can close this tab and return to the terminal.</p>
          </body>
        </html>
      `);

      console.log("\n✅ YouTube authorization successful!");
      console.log("✅ Tokens saved to data/tokens.json");

      server.close();
    } catch (err) {
      console.error(
        "\n❌ Failed to exchange authorization code:",
        err
      );

      res.writeHead(500);
      res.end("OAuth token exchange failed");

      server.close();
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, "localhost", () => {
      resolve();
    });

    server.on("error", reject);
  });

  console.log("Opening Google authorization...");
  console.log();

  console.log(authUrl);

  await open(authUrl);

  console.log();
  console.log(
    `Waiting for Google callback on http://localhost:${PORT}...`
  );
}
