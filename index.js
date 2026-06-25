// index.js
// Main server: receives WhatsApp webhook events and sends replies
// using the WhatsApp Cloud API.

require("dotenv").config();
const path = require("path");
const express = require("express");
const axios = require("axios");
const { handleMessage } = require("./conversation");

const app = express();
app.use(express.json());

const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  VERIFY_TOKEN,
  PORT = 3000,
  PUBLIC_BASE_URL = "https://mercury-whatsapp-bot.onrender.com"
} = process.env;

const GRAPH_API_URL = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// ---------------------------------------------------------------------
// Serve static assets (images used in bot replies, e.g. location banner)
// Accessible at: <your-render-url>/assets/<filename>
// ---------------------------------------------------------------------
app.use("/assets", express.static(path.join(__dirname, "assets")));

// ---------------------------------------------------------------------
// Health check (useful to confirm the server is alive on Render, etc.)
// ---------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("My Mercury Dry Cleaners WhatsApp bot is running.");
});

// ---------------------------------------------------------------------
// Webhook verification (Meta calls this once when you set up the webhook)
// ---------------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully.");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ---------------------------------------------------------------------
// Webhook receiver (Meta calls this every time a customer sends a message)
// ---------------------------------------------------------------------
app.post("/webhook", async (req, res) => {
  // Always respond 200 quickly so Meta doesn't retry/resend.
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Could be a status update (delivered/read) — ignore those.
      return;
    }

    const from = message.from; // customer's phone number
    const text = message.text?.body || "";

    console.log(`Incoming message from ${from}: ${text}`);

    const replies = handleMessage(from, text);

    for (const reply of replies) {
      await sendReply(from, reply);
    }
  } catch (err) {
    console.error("Error handling webhook event:", err?.response?.data || err.message);
  }
});

// ---------------------------------------------------------------------
// Helper: send a single reply, which can be either:
//   - a plain string -> sent as a text message
//   - an object { type: "image", path: "/assets/foo.png", caption?: "..." }
//     -> sent as an image message, using PUBLIC_BASE_URL + path as the link
// ---------------------------------------------------------------------
async function sendReply(to, reply) {
  if (typeof reply === "string") {
    return sendWhatsAppText(to, reply);
  }
  if (reply && reply.type === "image") {
    const imageLink = `${PUBLIC_BASE_URL}${reply.path}`;
    return sendWhatsAppImage(to, imageLink, reply.caption);
  }
  console.error("Unknown reply type, skipping:", reply);
}

// ---------------------------------------------------------------------
// Helper: send a text message via WhatsApp Cloud API
// ---------------------------------------------------------------------
async function sendWhatsAppText(to, body) {
  try {
    await axios.post(
      GRAPH_API_URL,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Error sending WhatsApp text message:", err?.response?.data || err.message);
  }
}

// ---------------------------------------------------------------------
// Helper: send an image message via WhatsApp Cloud API.
// `link` must be a publicly accessible HTTPS URL to the image.
// ---------------------------------------------------------------------
async function sendWhatsAppImage(to, link, caption) {
  try {
    await axios.post(
      GRAPH_API_URL,
      {
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: caption ? { link, caption } : { link }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Error sending WhatsApp image message:", err?.response?.data || err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
