import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const tokenFile = path.join(dataDir, "tokens.json");

export function saveTokens(tokens: object) {
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    tokenFile,
    JSON.stringify(tokens, null, 2),
    { mode: 0o600 }
  );
}

export function loadTokens() {
  if (!fs.existsSync(tokenFile)) {
    return null;
  }

  return JSON.parse(
    fs.readFileSync(tokenFile, "utf-8")
  );
}
