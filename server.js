// ============================================================
// Mercury Dry Cleaners — WhatsApp AI Auto-Reply Bot
// Uses: WhatsApp Cloud API (Meta) + Google Gemini (free tier)
// ============================================================

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ---------- CONFIG (set these in Render's Environment Variables) ----------
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;           // any string you choose, e.g. "mercury123"
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;        // from Meta App Dashboard > API Setup (permanent token)
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;      // from Meta App Dashboard > API Setup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;        // from https://aistudio.google.com/apikey

// ---------- BUSINESS INFO (edit this to match your shop) ----------
const BUSINESS_CONTEXT = `
You are the WhatsApp assistant for Mercury Dry Cleaners, a dry cleaning shop in Mahoba, Uttar Pradesh, running since 1980.

Services offered:
- Dry cleaning (suits, sarees, sherwanis, delicate wear)
- Stain removal (oil, ink, food, mehendi, monsoon stains)
- Eco-friendly cleaning
- Ironing & pressing
- Curtains & household linens
- Pickup & delivery across Mahoba

Shop hours: Mon-Sat 9:00 AM - 8:00 PM, Sunday 10:00 AM - 2:00 PM
Shop address: Civil Lines, Mahoba, Uttar Pradesh

Reply in a warm, helpful, concise tone. Use Hindi/Hinglish if the customer writes in Hindi/Hinglish, otherwise reply in English.
Keep replies short (2-4 sentences) since this is WhatsApp.
If someone wants to book a pickup, ask for: their name, address, and what items need cleaning.
If you don't know specific pricing, tell them to confirm exact pricing on call/in person, since prices vary by fabric and item.
Never make up information you're not sure about — invite them to call the shop for anything uncertain.
`;

// ---------- In-memory conversation history (resets if server restarts) ----------
// For a small shop this is fine. For scale, use a real database.
const conversations = {};

// ============================================================
// 1. WEBHOOK VERIFICATION (Meta calls this once when you set up the webhook)
// ============================================================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ============================================================
// 2. INCOMING MESSAGE HANDLER (Meta calls this every time a customer messages)
// ============================================================
app.post('/webhook', async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry/timeout
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return; // could be a status update, not a real message

    const from = message.from; // customer's WhatsApp number
    const msgType = message.type;

    let userText = '';
    if (msgType === 'text') {
      userText = message.text.body;
    } else {
      // For images, audio, etc. — reply with a simple fallback
      await sendWhatsAppMessage(from, "Thanks for sending that! For now, please describe what you need in text — our team will follow up on anything else.");
      return;
    }

    console.log(`Message from ${from}: ${userText}`);

    // Build conversation history for context
    if (!conversations[from]) conversations[from] = [];
    conversations[from].push({ role: 'user', text: userText });

    // Keep only last 10 turns to control token usage
    if (conversations[from].length > 10) {
      conversations[from] = conversations[from].slice(-10);
    }

    const aiReply = await getGeminiReply(conversations[from]);

    conversations[from].push({ role: 'model', text: aiReply });

    await sendWhatsAppMessage(from, aiReply);

  } catch (err) {
    console.error('Error handling webhook:', err.response?.data || err.message);
  }
});

// ============================================================
// 3. CALL GOOGLE GEMINI FOR A REPLY
// ============================================================
async function getGeminiReply(history) {
  const contents = history.map(turn => ({
    role: turn.role,
    parts: [{ text: turn.text }]
  }));

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents,
        systemInstruction: { parts: [{ text: BUSINESS_CONTEXT }] },
        generationConfig: { maxOutputTokens: 300, temperature: 0.6 }
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Sorry, I couldn't quite get that. Could you please rephrase, or call the shop directly?";
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    return "Sorry, I'm having trouble responding right now. Please call the shop directly, or try again in a moment.";
  }
}

// ============================================================
// 4. SEND A MESSAGE BACK VIA WHATSAPP CLOUD API
// ============================================================
async function sendWhatsAppMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('Error sending WhatsApp message:', err.response?.data || err.message);
  }
}

// ============================================================
// HEALTH CHECK (so Render/uptime tools can confirm it's alive)
// ============================================================
app.get('/', (req, res) => {
  res.send('Mercury Dry Cleaners WhatsApp bot is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
