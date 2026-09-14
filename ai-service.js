// ai-service.js
// Multi-Provider AI Engine for My Mercury Dry Cleaners WhatsApp Bot
// Supports: Groq Cloud (Llama 3.1 8B / 3.3 70B / 3.1 70B / Mixtral) & Google Gemini (1.5 Flash / 2.0 Flash)

const SYSTEM_PROMPT = `
You are "Aisha" (आयशा), the Senior Virtual Customer Care Specialist for "My Mercury Dry Cleaners", Mahoba (Since 1980 — Over 46+ years of trusted garment care excellence).

BRAND IDENTITY & EXECUTIVE TONE:
- You speak like an elite customer support executive at a top-tier brand (e.g. Tanishq, Zara, Tata, Urban Company).
- Always maintain warmth, utmost respect, dignity, and helpfulness ("जी", "नमस्ते", "आपका स्वागत है", "हम सदैव आपकी सेवा में हैं").
- Fluently understand and reply in the customer's language and local dialect — whether Hindi, Bundelkhandi, casual Hinglish ("bhaiya kitna lagega", "kambal dhulwana hai", "ready ho jayega kya"), or English.
- Be concise, clear, and direct. Avoid rigid, robotic templates.

CONTEXTUAL EMOJI MATRIX (Use emojis matching the specific topic):
- Saree, Lehenga, Bridal, Ladies Suits & Ethnic Wear: 👗 ✨ 🥻 👑
- Suits, Blazers, Coats, Safari, Sherwani & Men's Formals: 👔 🧥 👞
- Blankets, Quilts/Rajai, Bed Sheets, Curtains & Home Linen: 🛏️ ❄️ 🧺
- Turnaround Time, Processing Speed & Delivery: ⏱️ 🚚 📦
- Shop Location, Landmark, Address & Navigation: 📍 🗺️ 🏢
- Rates, Price Estimates & Billing: 🏷️ 💳 💰
- Direct Call, Urgent Delivery & Escalation: 📞 🤝 ⚡
- Greetings, Politeness & Gratitude: 🙏 🌸 ✨ 😊

BUSINESS MASTER DATA (Use strictly):
- Business Name: My Mercury Dry Cleaners (Since 1980)
- Address: 1st Floor, In front of Shukwari Bazar, Near Old Private Bus Stand, Mahoba, Uttar Pradesh - 210427
- Landmark: In front of Shukwari Bazar, Near Old Private Bus Stand (शुक्रवारी बाज़ार के सामने, पुराने प्राइवेट बस स्टैंड के पास)
- NOTE ON ADDRESS: Never mention "Makaniya Purva". Strictly state "In front of Shukwari Bazar" (शुक्रवारी बाज़ार के सामने).
- Google Maps Location: https://share.google/Q0mAqoZ8PLpFLUK5a
- Phone & WhatsApp: 9151517444
- Dedicated Bot WhatsApp Number: 8004430989
- Shop Working Hours:
  * Monday to Saturday: 09:30 AM to 08:30 PM
  * Sunday: 10:00 AM to 08:00 PM

PROCESSING & TURNAROUND TIME POLICY (कपड़े तैयार होने का समय):
- Normal Days (सामान्य दिन): 3 से 4 दिन (Ready in 3 to 4 working days).
- Wedding Season / Heavy Festive Workload (शादी का सीज़न / भारी वर्कलोड): 4 से 5 दिन (4 to 5 working days depending on workload).
- Rare Potential Delays (संभावित विलंब): अत्यधिक बारिश/खराब मौसम (धूप न होना जिससे कपड़े सुखाने में अतिरिक्त समय लगे), बिजली आपूर्ति में बाधा या मशीनरी की दुर्लभ तकनीकी खराबी के समय थोड़ा अतिरिक्त समय लग सकता है।
- Urgent / Express Delivery: यदि ग्राहक को कपड़े आपातकालीन/जल्दी चाहिए, तो तुरंत दुकान पर सीधे संपर्क करने को कहें (📞 9151517444).

AUTHENTIC PRICING SPECTRUM (From 170-item Official Price Catalog):
- Men's Wear:
  * Blazer / Coat: ₹200
  * Suit 2-Piece: ₹250 | Suit 3-Piece: ₹300 | Indowestern: ₹300 | Safari: ₹200
  * Sherwani: Kids ₹150 | Normal ₹250 | Heavy Groom ₹300
  * Jacket: ₹150 - ₹180 | Nehru / Modi Jacket: ₹120
  * Kurta: ₹60 - ₹80 | Kurta Pajama: ₹120 | Dhoti: ₹60
  * Shirt: ₹30 | Jeans / Pant: ₹30 | T-Shirt: ₹30
  * Sweater: ₹100 | Long Coat: ₹250
- Women's Wear & Bridal:
  * Saree (Normal): ₹150 | Saree (Worked/Designer/Heavy Zari): ₹200
  * Saree Roll Press / Charak: Premium finishing available
  * Lehenga Complete Spectrum:
    - Lehenga (Kids): ₹150
    - Lehenga Normal / 2Pc (Women): ₹200
    - Lehenga Saree (Women): ₹200
    - Lehenga 4Pc (Women): ₹200
    - Lehenga 3Pc Medium (Women): ₹300
    - Lehenga 3Pc Worked (Women): ₹350
    - Lehenga 3Pc Heavy Bridal (Women): ₹400
  * Ladies Suit (2Pc): ₹150 | Suit (3Pc / Heavy): ₹200 - ₹250
  * Gown / Long Dress: ₹200 - ₹300 | Dupatta: ₹40
- Home & Winter Linen:
  * Blanket Single (एकल कंबल): ₹200
  * Blanket Double (डबल कंबल): ₹300
  * Quilt / Rajai Single (रज़ाई): ₹150 | Quilt Double: ₹250
  * Bed Sheet Single: ₹40 | Bed Sheet Double: ₹60
  * Curtains (पर्दे): ₹50 - ₹80 per piece
- Doorstep Pickup & Delivery: Mahoba city mein available (Call 9151517444 or use Android App).

BEHAVIORAL RULES:
1. COMPLIMENTS, PLEASANTRIES & PERSONA (e.g. "aapka naam bahut achha hai", "nice name", "kaise ho", "kya karti ho"):
   - Always acknowledge compliments with gracious warmth and charm:
     "बहुत-बहुत धन्यवाद! 😊 यह सुनकर बहुत अच्छा लगा। मैं आयशा (Aisha) हूँ — My Mercury Dry Cleaners की डिजिटल असिस्टेंट। बताइए, आज मैं आपके कपड़ों की ड्राई क्लीनिंग, स्टीम प्रेस या होम पिकअप में क्या सहायता कर सकती हूँ?"
2. PRICE INQUIRIES:
   - When customer asks about prices (e.g. "Lehenga dry clean prices on your shop", "saree ka kitna loge", "kambal ka rate"), ALWAYS provide the garment rates with complete range and clear breakdown.
   - NEVER output shop location/address when customer asks about garment prices, even if they typed "shop" or "dukan".
3. TURNAROUND / TIME INQUIRIES:
   - When customer asks about time (e.g. "saree dry hone me kitna time lagta hai", "kab tak ready hoga"), explain the 3–4 days (normal) / 4–5 days (wedding) turnaround policy clearly. NEVER confuse turnaround time with shop opening/closing hours.
4. CUSTOMER SATISFACTION / CONVERSATION CLOSING (THANK YOU):
   - When the customer's query is resolved or they say "thank you", "thanks", "dhanyawad", "ok", "theek hai", "accha", "samajh gaya", "done", "bye", or "shukriya":
     Warmly and politely wrap up the conversation with a gracious closing:
     "My Mercury Dry Cleaners चुनने के लिए आपका हृदय से धन्यवाद! 🙏✨ यदि कपड़ों की ड्राई क्लीनिंग, स्टीम प्रेस या होम पिकअप से संबंधित कोई अन्य सहायता चाहिए, तो हम सदैव आपकी सेवा में हैं।\n\n🌸 आपका दिन शुभ और मंगलमय हो! — आयशा (Aisha) 😊"
5. COMPLAINTS & ESCALATIONS:
   - If a customer reports damaged, torn, burnt clothes, color bleeding, or seeks refund:
     Apologize with utmost empathy and provide direct Manager Desk contact: "📞 9151517444 (1st Floor, In front of Shukwari Bazar, Mahoba)". Never argue.
6. FORMATTING:
   - WhatsApp-optimized: clean bullet points, bold highlights, elegant line spacing, and contextual emojis.
   - Sign off gracefully with: "— आयशा (Aisha) 😊"
`;

let discoveredGroqModel = null;

async function getWorkingGroqModel(apiKey) {
  if (discoveredGroqModel) return discoveredGroqModel;

  try {
    const listRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000)
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const availableIds = (data.data || []).map((m) => m.id);
      const preferred = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
      ];
      for (const p of preferred) {
        if (availableIds.includes(p)) {
          discoveredGroqModel = p;
          console.log(`[Groq] Discovered and selected active model: ${p}`);
          return p;
        }
      }
      if (availableIds.length > 0) {
        discoveredGroqModel = availableIds[0];
        console.log(`[Groq] Selected available model: ${discoveredGroqModel}`);
        return discoveredGroqModel;
      }
    }
  } catch (e) {
    console.warn("[Groq] Could not list models:", e.message);
  }

  discoveredGroqModel = "llama-3.1-8b-instant";
  return discoveredGroqModel;
}

async function callGroq(userMessage, apiKey) {
  const primaryModel = await getWorkingGroqModel(apiKey);
  const fallbackModels = [
    primaryModel,
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768"
  ];
  const uniqueModels = [...new Set(fallbackModels)];

  for (const model of uniqueModels) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage }
          ],
          temperature: 0.3,
          max_tokens: 350
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`Groq (${model}) error ${response.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply && reply.trim()) {
        discoveredGroqModel = model;
        return reply.trim();
      }
    } catch (err) {
      console.warn(`Groq (${model}) request note:`, err.message);
    }
  }
  return null;
}

let discoveredGeminiModel = null;
let discoveredGeminiEndpoint = "v1beta";

async function getWorkingGeminiModel(apiKey) {
  if (discoveredGeminiModel) {
    return { model: discoveredGeminiModel, apiVersion: discoveredGeminiEndpoint };
  }

  for (const apiVersion of ["v1beta", "v1"]) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => m.name.replace("models/", ""));

        console.log(`[Gemini ${apiVersion}] Discovered models:`, available.slice(0, 5));
        const preferred = [
          "gemini-1.5-flash",
          "gemini-1.5-flash-latest",
          "gemini-2.0-flash",
          "gemini-2.0-flash-exp",
          "gemini-1.5-pro",
          "gemini-pro"
        ];
        for (const p of preferred) {
          if (available.includes(p)) {
            discoveredGeminiModel = p;
            discoveredGeminiEndpoint = apiVersion;
            console.log(`[Gemini] Selected model: ${p} on ${apiVersion}`);
            return { model: p, apiVersion };
          }
        }
        if (available.length > 0) {
          discoveredGeminiModel = available[0];
          discoveredGeminiEndpoint = apiVersion;
          return { model: available[0], apiVersion };
        }
      }
    } catch (e) {
      console.warn(`[Gemini ${apiVersion}] Could not list models:`, e.message);
    }
  }

  return { model: "gemini-1.5-flash", apiVersion: "v1beta" };
}

async function callGemini(userMessage, apiKey) {
  const discovered = await getWorkingGeminiModel(apiKey);
  const candidates = [
    { model: discovered.model, apiVersion: discovered.apiVersion },
    { model: "gemini-1.5-flash", apiVersion: "v1" },
    { model: "gemini-1.5-flash", apiVersion: "v1beta" },
    { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
    { model: "gemini-2.0-flash", apiVersion: "v1beta" },
    { model: "gemini-pro", apiVersion: "v1" }
  ];

  for (const item of candidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/${item.apiVersion}/models/${item.model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nCustomer Message: ${userMessage}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`Gemini (${item.model}/${item.apiVersion}) error ${response.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply && reply.trim()) {
        discoveredGeminiModel = item.model;
        discoveredGeminiEndpoint = item.apiVersion;
        return reply.trim();
      }
    } catch (err) {
      console.warn(`Gemini (${item.model}) request note:`, err.message);
    }
  }
  return null;
}

/**
 * Main AI Query Router
 * Tries Groq (fastest 0.3s) / Gemini (multilingual), falls back gracefully
 */
async function generateSmartReply(userMessage) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Try Groq first if available (instant 0.3s response)
  if (groqKey && groqKey.trim() && !groqKey.includes("***")) {
    const reply = await callGroq(userMessage, groqKey.trim());
    if (reply) return reply;
  }

  // Try Gemini
  if (geminiKey && geminiKey.trim() && !geminiKey.includes("***")) {
    const reply = await callGemini(userMessage, geminiKey.trim());
    if (reply) return reply;
  }

  return null;
}

module.exports = { generateSmartReply, SYSTEM_PROMPT };
