(async () => {
  const { Blob } = await import("fetch-blob");
  const { FormData } = await import("formdata-polyfill/esm.min.js");

  globalThis.Blob = globalThis.Blob || Blob;
  globalThis.FormData = globalThis.FormData || FormData;
})();

(async () => {
  const fetchModule = await import("node-fetch");
  const fetch = fetchModule.default;

  if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = fetch;
    globalThis.Headers = fetchModule.Headers;
    globalThis.Request = fetchModule.Request;
    globalThis.Response = fetchModule.Response;
  }
})();

const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const KEYFILEPATH = path.join(__dirname, "../credentials/service-account.json");

// Auth setup
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// ✅ Initialize calendar client (this was missing!)
const calendar = google.calendar({ version: "v3", auth });

async function createGoogleMeetEvent({ title, description, startTime, endTime, attendees }) {
  const event = {
    summary: title || "Meet",
    description: description || "Paid session",
    start: {
      dateTime: startTime, // must be ISO string with timezone
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endTime,
      timeZone: "Asia/Kolkata",
    },
    attendees: attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: String(Date.now()),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return response.data;
}

module.exports = { createGoogleMeetEvent };
