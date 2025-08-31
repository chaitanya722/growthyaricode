const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "../credentials/oauth-client.json");
const TOKEN_PATH = path.join(__dirname, "../credentials/token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
];

function getOAuthClient() {
  const credentials = require(CREDENTIALS_PATH).installed;
  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0] // this is "http://localhost"
  );
}

function getAuthUrl() {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });
}

async function getToken(code) {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

function getSavedClient() {
  const oAuth2Client = getOAuthClient();
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(tokens);
  }
  return oAuth2Client;
}

module.exports = { getAuthUrl, getToken, getSavedClient };
