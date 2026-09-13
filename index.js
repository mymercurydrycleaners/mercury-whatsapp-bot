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

    // Extract text from text message, interactive button, quick reply, or audio voice note
    let text = "";
    let isVoiceMessage = false;

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "audio") {
      isVoiceMessage = true;
      const audioId = message.audio?.id;
      if (audioId) {
        console.log(`Received WhatsApp voice note from ${from} (Media ID: ${audioId}), transcribing...`);
        text = await transcribeWhatsAppAudio(audioId);
      }
      if (!text) {
        await sendWhatsAppText(
          from,
          "🙏 नमस्ते! मुझे आपका वॉइस मैसेज मिला, लेकिन तकनीकी कारण से आवाज़ स्पष्ट सुनाई नहीं दी।\n\nकृपया अपना सवाल लिखकर भेजें या सीधे हमारे मैनेजर डेस्क पर कॉल करें: 📞 *9151517444*"
        );
        return;
      }
    } else if (message.type === "interactive") {
      text =
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        message.interactive?.list_reply?.id ||
        "";
    } else if (message.type === "button") {
      text = message.button?.text || "";
    }

    console.log(`Incoming message from ${from}: "${text}" (Voice: ${isVoiceMessage})`);

    const replies = await handleMessage(from, text);

    for (let i = 0; i < replies.length; i++) {
      let reply = replies[i];
      if (isVoiceMessage && i === 0 && typeof reply === "string") {
        reply = `🎤 *[आपने पूछा:]* "${text}"\n\n` + reply;
      }
      await sendReply(from, reply);
    }
  } catch (err) {
    console.error("Error handling webhook event:", err?.response?.data || err.message);
  }
});

// ---------------------------------------------------------------------
// Voice Note Transcription via Groq Whisper API (100% Free & Fast)
// ---------------------------------------------------------------------
async function transcribeWhatsAppAudio(audioId) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || !groqKey.trim() || groqKey.includes("***")) {
      console.warn("GROQ_API_KEY is not configured for voice transcription.");
      return null;
    }

    // 1. Get media URL from Meta Graph API
    const mediaRes = await axios.get(`https://graph.facebook.com/v20.0/${audioId}`, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    const mediaUrl = mediaRes.data?.url;
    if (!mediaUrl) return null;

    // 2. Download audio binary from Meta
    const audioRes = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      responseType: "arraybuffer"
    });
    const audioBuffer = Buffer.from(audioRes.data);

    // 3. Send audio to Groq Whisper v3
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/ogg" });
    formData.append("file", blob, "voice.ogg");
    formData.append("model", "whisper-large-v3");
    formData.append("temperature", "0");

    const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey.trim()}` },
      body: formData,
      signal: AbortSignal.timeout(10000)
    });

    if (!whisperRes.ok) {
      const errTxt = await whisperRes.text().catch(() => "");
      console.error("Groq Whisper transcription error:", whisperRes.status, errTxt);
      return null;
    }

    const whisperData = await whisperRes.json();
    return whisperData.text?.trim() || null;
  } catch (err) {
    console.error("Audio transcription failed:", err.message);
    return null;
  }
}

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
