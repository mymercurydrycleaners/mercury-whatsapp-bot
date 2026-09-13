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
// Health check
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
      // Status update (delivered/read/sent) — ignore
      return;
    }

    const from = message.from; // customer's phone number

    // Extract text from text message, interactive button, or quick reply
    let text = "";
    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "interactive") {
      text =
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        message.interactive?.list_reply?.id ||
        "";
    } else if (message.type === "button") {
      text = message.button?.text || "";
    }

    console.log(`Incoming message from ${from}: "${text}"`);

    const replies = await handleMessage(from, text);

    for (const reply of replies) {
      await sendReply(from, reply);
    }
  } catch (err) {
    console.error("Error handling webhook event:", err?.response?.data || err.message);
  }
});

// ---------------------------------------------------------------------
// Helper: send a single reply
// ---------------------------------------------------------------------
async function sendReply(to, reply) {
  if (typeof reply === "string") {
    return sendWhatsAppText(to, reply);
  }
  if (reply && reply.type === "image") {
    const imageLink = reply.url || `${PUBLIC_BASE_URL}${reply.path}`;
    try {
      await sendWhatsAppImage(to, imageLink, reply.caption);
    } catch (e) {
      console.warn("Failed to send image, falling back:", e.message);
    }
    return;
  }
  console.error("Unknown reply type, skipping:", reply);
}

// ---------------------------------------------------------------------
// Helper: send a text message via WhatsApp Cloud API
// ---------------------------------------------------------------------
async function sendWhatsAppText(to, body) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set. Cannot send WhatsApp message.");
    return;
  }

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
    console.error("Error sending WhatsApp text message:", JSON.stringify(err?.response?.data || err.message));
  }
}

// ---------------------------------------------------------------------
// Helper: send an image message via WhatsApp Cloud API
// ---------------------------------------------------------------------
async function sendWhatsAppImage(to, link, caption) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set. Cannot send WhatsApp image.");
    return;
  }

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
    console.error("Error sending WhatsApp image message:", JSON.stringify(err?.response?.data || err.message));
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
