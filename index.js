// index.js
// Main server: receives WhatsApp webhook events, sends AI replies,
// serves Live Enquiry Dashboard App (PWA) & sends Real-Time Owner Alerts.

require("dotenv").config();
const path = require("path");
const express = require("express");
const axios = require("axios");
const { handleMessage } = require("./conversation");
const {
  processPendingReminders,
  getEnquiryStats,
  getAllEnquiries,
  getEnquiryById,
  resolveEnquiry,
  reopenEnquiry,
  deleteEnquiry,
  sendManualReminder,
  getSettings,
  saveSettings,
  setOwnerNotifier
} = require("./reminders");

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
// Static assets & PWA files
// ---------------------------------------------------------------------
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------
// Owner Real-Time WhatsApp Alert Handler
// ---------------------------------------------------------------------
const ownerAlertCooldown = new Map();

setOwnerNotifier(async (enquiry, isNew) => {
  try {
    const settings = getSettings();
    if (!settings.enableWhatsAppAlerts || !settings.ownerAlertPhone) return;

    const ownerPhone = settings.ownerAlertPhone.replace(/[^0-9]/g, "");
    if (!ownerPhone || ownerPhone === enquiry.phone) return;

    // Cooldown of 3 minutes per customer phone to avoid rapid multiple alerts
    const lastAlert = ownerAlertCooldown.get(enquiry.phone) || 0;
    if (Date.now() - lastAlert < 3 * 60 * 1000) return;
    ownerAlertCooldown.set(enquiry.phone, Date.now());

    const now = new Date();
    const timeIST = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const dateIST = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short"
    });

    const customerDisplay = enquiry.customerName
      ? `${enquiry.customerName} (+${enquiry.phone})`
      : `+${enquiry.phone}`;

    const alertBody =
      `🔔 *नई ग्राहक Enquiry अलर्ट!*\n` +
      `*My Mercury Dry Cleaners, Mahoba*\n\n` +
      `👤 *ग्राहक:* ${customerDisplay}\n` +
      `🏷️ *विषय:* ${enquiry.item}\n` +
      `💬 *मैसेज:* "${enquiry.rawQuery || enquiry.item}"\n` +
      `🕒 *समय:* ${dateIST}, ${timeIST}\n\n` +
      `👉 *ग्राहक को तुरंत WhatsApp करें:*\nhttps://wa.me/${enquiry.phone}\n\n` +
      `📱 *लाइव Enquiry App देखें:*\n${PUBLIC_BASE_URL}/admin`;

    await sendWhatsAppText(ownerPhone, alertBody);
    console.log(`[Alert] Sent instant WhatsApp notification to owner (${ownerPhone}) for enquiry ${enquiry.id}`);
  } catch (err) {
    console.error("[Alert] Error notifying owner:", err.message);
  }
});

// ---------------------------------------------------------------------
// Admin Web App Pages & Redirects
// ---------------------------------------------------------------------
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/dashboard", (req, res) => res.redirect("/admin"));
app.get("/app", (req, res) => res.redirect("/admin"));

// ---------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("My Mercury Dry Cleaners WhatsApp bot is running. Visit /admin for Enquiry App.");
});

// ---------------------------------------------------------------------
// Dashboard & Enquiry API Endpoints
// ---------------------------------------------------------------------

// Verify Admin PIN
app.post("/api/auth/verify", (req, res) => {
  const { pin } = req.body || {};
  const currentPin = getSettings().adminPin || "1744";
  if (pin === currentPin) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Incorrect PIN" });
  }
});

// Get enquiries list and stats
app.get("/api/enquiries", (req, res) => {
  res.json({
    stats: getEnquiryStats(),
    enquiries: getAllEnquiries(),
    settings: {
      ownerAlertPhone: getSettings().ownerAlertPhone,
      enableWhatsAppAlerts: getSettings().enableWhatsAppAlerts
    }
  });
});

// Mark enquiry as resolved
app.post("/api/enquiries/:id/resolve", (req, res) => {
  resolveEnquiry(req.params.id);
  res.json({ success: true, stats: getEnquiryStats() });
});

// Re-open enquiry as pending
app.post("/api/enquiries/:id/reopen", (req, res) => {
  const reopened = reopenEnquiry(req.params.id);
  if (reopened) {
    res.json({ success: true, stats: getEnquiryStats() });
  } else {
    res.status(404).json({ error: "Enquiry not found" });
  }
});

// Send manual WhatsApp reminder from dashboard
app.post("/api/enquiries/:id/remind", async (req, res) => {
  try {
    const result = await sendManualReminder(req.params.id, sendWhatsAppText);
    res.json({ success: true, ...result, stats: getEnquiryStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an enquiry
app.post("/api/enquiries/:id/delete", (req, res) => {
  const deleted = deleteEnquiry(req.params.id);
  res.json({ success: deleted, stats: getEnquiryStats() });
});

// Get current settings
app.get("/api/settings", (req, res) => {
  const s = getSettings();
  res.json({
    ownerAlertPhone: s.ownerAlertPhone,
    enableWhatsAppAlerts: s.enableWhatsAppAlerts
  });
});

// Update settings
app.post("/api/settings", (req, res) => {
  const { ownerAlertPhone, enableWhatsAppAlerts, adminPin } = req.body || {};
  const toUpdate = {};
  if (typeof ownerAlertPhone === "string") toUpdate.ownerAlertPhone = ownerAlertPhone.trim();
  if (typeof enableWhatsAppAlerts === "boolean") toUpdate.enableWhatsAppAlerts = enableWhatsAppAlerts;
  if (adminPin && String(adminPin).trim()) toUpdate.adminPin = String(adminPin).trim();

  const updated = saveSettings(toUpdate);
  res.json({
    success: true,
    ownerAlertPhone: updated.ownerAlertPhone,
    enableWhatsAppAlerts: updated.enableWhatsAppAlerts
  });
});

// Send a test WhatsApp alert to owner's phone
app.post("/api/test-alert", async (req, res) => {
  try {
    const s = getSettings();
    const targetPhone = (req.body?.phone || s.ownerAlertPhone || "").replace(/[^0-9]/g, "");
    if (!targetPhone) {
      return res.status(400).json({ error: "Owner phone number is not configured" });
    }

    const testMsg =
      `🔔 *टेस्ट अलर्ट (Test Alert)*\n` +
      `*My Mercury Dry Cleaners WhatsApp Bot*\n\n` +
      `✅ आपका WhatsApp Enquiry अलर्ट सिस्टम सफलतापूर्वक चालू है!\n` +
      `जब भी कोई ग्राहक कंबल, साड़ी, कोट आदि के बारे में पूछेगा, आपको ऐसा ही तुरंत नोटिफिकेशन मिलेगा।\n\n` +
      `📱 लाइव ऐप: ${PUBLIC_BASE_URL}/admin`;

    await sendWhatsAppText(targetPhone, testMsg);
    res.json({ success: true, sentTo: targetPhone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// Reminders Keep-Alive & Runner endpoints
// ---------------------------------------------------------------------
app.get("/reminders/stats", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stats: getEnquiryStats()
  });
});

app.get("/reminders/process", async (req, res) => {
  try {
    await processPendingReminders(sendWhatsAppText);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: getEnquiryStats()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const contact = value?.contacts?.[0];
    const customerName = contact?.profile?.name || "";

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

    console.log(`Incoming message from ${from} (${customerName}): "${text}" (Voice: ${isVoiceMessage})`);

    const replies = await handleMessage(from, text, { customerName, isVoiceMessage });

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
    formData.append("language", "hi"); // Strictly Hindi (Devanagari script) - NEVER Urdu
    formData.append("prompt", "My Mercury Dry Cleaners, Mahoba. Hindi voice note: dry cleaning, saree, blazer, coat, suit, lehenga, rate, price, kambal, delivery.");
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
  console.log(`Live Enquiry Dashboard available at: /admin`);

  // Background processor: Check and send pending enquiry reminders every 5 minutes
  setInterval(async () => {
    try {
      await processPendingReminders(sendWhatsAppText);
    } catch (err) {
      console.error("Auto-reminder runner error:", err.message);
    }
  }, 5 * 60 * 1000);
});
