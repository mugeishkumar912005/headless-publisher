"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const googleapis_1 = require("googleapis");
console.log("CLIENT_ID loaded:", Boolean(process.env.CLIENT_ID));
console.log("CLIENT_SECRET loaded:", Boolean(process.env.CLIENT_SECRET));
console.log("YOUTUBE_REFRESH_TOKEN loaded:", Boolean(process.env.YOUTUBE_REFRESH_TOKEN));
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});
const youtube = googleapis_1.google.youtube({
    version: "v3",
    auth: oauth2Client,
});
exports.default = youtube;
