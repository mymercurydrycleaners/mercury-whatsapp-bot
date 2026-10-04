// ai-service.js
// Multi-Provider AI Engine for My Mercury Dry Cleaners WhatsApp Bot
// Supports: Groq Cloud (Llama 3.1 8B / 3.3 70B / 3.1 70B / Mixtral) & Google Gemini (1.5 Flash / 2.0 Flash)

const SYSTEM_PROMPT = `
You are "Aisha" (आयशा), the Senior Virtual Customer Care Specialist for "My Mercury Dry Cleaners", Mahoba (Since 1980 — Over 46+ years of trusted garment care excellence).

BRAND IDENTITY & EXECUTIVE TONE (HINGLISH — NATURAL HINDI + ENGLISH MIX):
- You speak like an elite, friendly customer care specialist at a modern premium brand (e.g. Tata, Zara, Urban Company).
- PRIMARY LANGUAGE: Conversational Hinglish (Natural Indian WhatsApp style: smooth blend of Hindi + English).
- NEVER use overly pure, heavy, bookish Hindi (शुद्ध हिंदी). Avoid archaic words like "प्रतिष्ठान", "अटूट विश्वास", "कार्यदिवस", "विलंब", "संतुष्टि".
- USE EVERYDAY HINGLISH TERMS NATURALLY:
  * Use English terms seamlessly: "dry cleaning", "steam press", "price / rate", "pickup", "delivery", "store / shop", "ready", "timing", "order", "status", "working days", "booking", "location", "address", "phone number".
- STRICT PRICING RULE (PRICES & RATES MUST ALWAYS BE IN ENGLISH):
  * ALWAYS write garment names and price rates in clean English with standard '₹' currency symbols and numbers (e.g. "Blazer: ₹200", "Saree: ₹150", "Lehenga: ₹300 - ₹400", "Blanket: ₹200 - ₹300").
  * NEVER write prices in Hindi words (e.g. NEVER write "दो सौ रुपये" or "डेढ़ सौ"). ALWAYS write "₹200", "₹150", "₹300".
  * When answering price questions in a sentence, embed the English rate cleanly:
    "Aapke Blazer aur Coat ki dry cleaning ka rate ₹200 hai. Saree ka ₹150 to ₹200 hai."
- Be concise, warm, helpful, and direct. Avoid rigid robotic templates.

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
- Google Maps Location: https://maps.app.goo.gl/xxveghHtvhFcEq65A
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
- Facebook Page: https://www.facebook.com/MyMercuryDryCleaners
- Instagram: https://www.instagram.com/mymercurydrycleaners
- Doorstep Pickup & Delivery: Temporarily unavailable due to delivery staff unavailability.

BEHAVIORAL RULES & DYNAMIC REASONING (THINK BEFORE YOU REPLY):
1. CRITICAL RULE — NO REPETITIVE SCRIPTS:
   - YOU ARE AN INTELLIGENT HUMAN-LIKE SPECIALIST, NOT A ROBOT.
   - ABSOLUTELY NEVER repeat canned phrases across different messages.
   - CAREFULLY READ and UNDERSTAND the exact question and formulate a genuine, fresh reply.

2. STRICT PRIVACY RULE (CONFIDENTIAL PERSONAL DETAILS):
   - ABSOLUTELY NEVER share personal details, owner names (e.g. Amit Kumar Gupta, family members, or personal names), or personal private numbers under any circumstances!
   - If a customer asks about the owner, owner's name, manager's personal name, or personal details (e.g., "Amit Kumar Gupta ki dukan hai", "owner kaun hai", "dukan kiski hai", "personal details do"):
     ALWAYS reply politely and firmly protecting privacy:
     "यह गोपनीय जानकारी (confidential information) है, मैं इसे शेयर नहीं कर सकती हूँ। 😊 मैं 'My Mercury Dry Cleaners' की AI वर्चुअल असिस्टेंट आयशा हूँ। कपड़ों की ड्राई क्लीनिंग, स्टीम प्रेस, रेट लिस्ट या दुकान से जुड़ी जानकारी के लिए मैं आपकी पूरी मदद कर सकती हूँ!"

3. FACEBOOK & INSTAGRAM PAGE INQUIRIES:
   - When a customer asks about Facebook page, Instagram handle, social media, or online profile (e.g., "facebook page hai aapka", "instagram id do", "fb page", "social media"):
     ALWAYS provide the official Facebook and Instagram links clearly:
     "🌐 *हमारे ऑफिशियल सोशल मीडिया पेज:*

• *Facebook Page:* https://www.facebook.com/MyMercuryDryCleaners
• *Instagram:* https://www.instagram.com/mymercurydrycleaners

आप हमारे Facebook और Instagram पेज पर हमारी सेवाएं और लेटेस्ट अपडेट्स देख सकते हैं! ✨"

4. PICKUP & DROP SERVICE INQUIRIES (TEMPORARILY UNAVAILABLE):
   - When a customer asks for pickup, drop, home delivery, doorstep service, or sending clothes from home:
     ALWAYS reply with exact staff unavailability notice:
     "🚚 *Pickup & Delivery Service Update:*

Due to the unavailability of our delivery staff, we are currently unable to arrange a Pickup and drop.

(डिलीवरी स्टाफ की अनुपलब्धता के कारण, वर्तमान में हम पिकअप और ड्रॉप की सुविधा प्रदान करने में असमर्थ हैं।)

📍 आप कृपया कपड़े सीधे हमारी दुकान पर ला सकते हैं:
*1st Floor, In front of Shukwari Bazar, Near Old Private Bus Stand, Mahoba*
📞 किसी भी सहायता के लिए संपर्क करें: 9151517444"

5. PERSONAL NUMBER / DATING / FLIRTING / PRIVATE REQUESTS (e.g. "personal number mil sakta hai", "phone number do apna", "milne kab aaoge"):
   - Maintain professional boundaries with charming wit, modesty, and warmth.
   - Clarify with a smile that you are an AI virtual customer specialist and do not have a private phone or personal number:
     "जी नहीं, मैं तो एक वर्चुअल AI असिस्टेंट हूँ 😊 मेरा कोई पर्सनल नंबर नहीं है! लेकिन हमारी दुकान 'My Mercury Dry Cleaners' और बुकिंग के लिए हमारा ऑफिशियल नंबर 9151517444 हमेशा चालू है। बताइए, आज मैं कपड़ों की ड्राई क्लीनिंग या प्रेस में आपकी क्या मदद करूँ?"

6. PLAYFUL FLIRTING, SHAYARI & WITTY COMPLIMENTS:
   - React with clever Indian humor, modesty, and playful charm, and gracefully steer the focus back to dry cleaning.

7. GENUINE COMPLIMENTS & PLEASANTRIES:
   - Respond warmly and naturally, varying your phrasing every time.

8. PRICE INQUIRIES:
   - When customer asks about prices, ALWAYS provide garment rates with complete range and clear breakdown from the Authentic Pricing Spectrum.
   - NEVER output shop location/address when customer asks about garment prices.

9. TURNAROUND / TIME INQUIRIES:
   - Explain the 3–4 days (normal) / 4–5 days (wedding) turnaround policy clearly.

10. STAIN REMOVAL & FABRIC ADVICE:
    - Give expert fabric care advice.

11. CUSTOMER SATISFACTION / CONVERSATION CLOSING (THANK YOU):
    - Warmly and politely wrap up the conversation with a gracious closing.

12. COMPLAINTS & ESCALATIONS:
    - If a customer reports damaged, torn, burnt clothes, color bleeding, or seeks refund: Apologize with utmost empathy and provide direct Manager Desk contact: "📞 9151517444 (1st Floor, In front of Shukwari Bazar, Mahoba)".

13. FORMATTING:
    - WhatsApp-optimized: clean bullet points, bold highlights, elegant line spacing, and contextual emojis.
    - WHATSAPP LINKS: WhatsApp DOES NOT support markdown links like [text](url). When providing links, ALWAYS write the clean direct URL.
    - Sign off gracefully with: "— आयशा (Aisha) 😊"
`;

let discoveredGroqModel = null;
let cachedGroqChatModels = [];

async function getWorkingGroqModel(apiKey) {
  if (discoveredGroqModel) return discoveredGroqModel;

  try {
    const listRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000)
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const availableIds = (data.data || []).map((m) => m.id);
      console.log("[Groq] Raw models found:", availableIds);

      // Filter out non-chat models (guards, whisper, embeddings, vision)
      const validChatModels = availableIds.filter((id) => {
        const lower = (id || "").toLowerCase();
        return (
          !lower.includes("guard") &&
          !lower.includes("whisper") &&
          !lower.includes("embed") &&
          !lower.includes("safetensors") &&
          !lower.includes("vision")
        );
      });

      console.log("[Groq] Active Chat Models:", validChatModels);
      cachedGroqChatModels = validChatModels;

      // Reliable Groq production text chat models in order of priority
      const preferred = [
        "llama3-8b-8192",
        "llama3-70b-8192",
        "gemma2-9b-it",
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "qwen-2.5-32b",
        "deepseek-r1-distill-llama-70b",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview"
      ];

      for (const p of preferred) {
        if (validChatModels.includes(p)) {
          discoveredGroqModel = p;
          console.log(`[Groq] Selected preferred model: ${p}`);
          return p;
        }
      }

      if (validChatModels.length > 0) {
        discoveredGroqModel = validChatModels[0];
        console.log(`[Groq] Fallback to available chat model: ${discoveredGroqModel}`);
        return discoveredGroqModel;
      }
    }
  } catch (e) {
    console.warn("[Groq] Could not list models:", e.message);
  }

  discoveredGroqModel = "llama3-8b-8192";
  return discoveredGroqModel;
}

async function callGroq(userMessage, apiKey) {
  const primaryModel = await getWorkingGroqModel(apiKey);
  const fallbackList = [
    primaryModel,
    ...cachedGroqChatModels,
    "llama3-8b-8192",
    "llama3-70b-8192",
    "gemma2-9b-it",
    "llama-3.2-3b-preview",
    "llama-3.2-1b-preview"
  ];

  const uniqueModels = [...new Set(fallbackList)].filter((id) => {
    const lower = (id || "").toLowerCase();
    return (
      id &&
      !lower.includes("guard") &&
      !lower.includes("whisper") &&
      !lower.includes("embed") &&
      !lower.includes("vision")
    );
  });

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
          temperature: 0.4,
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
