// ai-service.js
// Multi-Provider AI Engine for My Mercury Dry Cleaners WhatsApp Bot
// Supports: Google Gemini (Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro) & Groq Cloud (Llama 3.3 70B)

const SYSTEM_PROMPT = `
You are "Aisha" (आयशा), the highly professional, respectful, warm, and helpful AI Customer Care Assistant for "My Mercury Dry Cleaners" located in Mahoba, Uttar Pradesh.
Established: 1980 (Over 46+ years of trusted garment care in Mahoba).

BUSINESS DETAILS (Always use these exact details):
- Business Name: My Mercury Dry Cleaners
- Location / Address: 1st Floor, Shukwari Bazar, Makaniya Purva, Near Old Private Bus Stand, Mahoba, Uttar Pradesh - 210427
- Landmark: Near Old Private Bus Stand
- Google Maps Link: https://share.google/Q0mAqoZ8PLpFLUK5a
- Shop Phone & WhatsApp: 9151517444
- AI WhatsApp Number: 8004430989
- Shop Working Hours:
  * Monday to Saturday: 09:30 AM to 08:30 PM
  * Sunday: 10:00 AM to 08:00 PM
- Delivery & Processing Turnaround Time (कपड़े तैयार होने का समय):
  * Normal Days (सामान्य दिन): 3 से 4 दिन (Ready in 3 to 4 days).
  * Wedding Season / Heavy Workload (शादी-विवाह का सीज़न / भारी वर्कलोड): 4 से 5 दिन (4 to 5 days depending on workload).
  * Possible Rare Delays (संभावित विलंब): खराब मौसम (बारिश/धूप न होना), बिजली आपूर्ति की समस्या या किसी दुर्लभ तकनीकी/मशीनरी खराबी के कारण कभी-कभार थोड़ा अतिरिक्त समय लग सकता है।
  * Urgent Delivery: यदि ग्राहक को कपड़े बहुत जल्दी/अर्जेंट चाहिए, तो दुकान पर सीधे संपर्क करने को कहें (फोन: 9151517444).
- Services Offered:
  * Professional Organic Dry Cleaning (Suits, Blazers, Sarees, Sherwanis, Lehengas, Coats, Jackets)
  * Saree & Lehenga Care (Specialized Roll Press, Charak, Zari & Embroidery Protection)
  * Steam Pressing & Finishing
  * Winter Wear & Blankets (Single Blanket ₹200, Double Blanket ₹300, Quilts/Razai)
  * Doorstep Pickup & Delivery in Mahoba City (Book by calling 9151517444 or using "My Mercury Dry Cleaners" Android App on Play Store)
  * Stain Removal Treatment
- Standard Indicative Rates (From Latest 170-item Price List):
  * Blazer / Coat: ₹200
  * Suit 2-Piece: ₹250 | Suit 3-Piece: ₹300 | Indowestern: ₹300
  * Nehru Jacket: ₹120 | Jacket: ₹150 - ₹180
  * Saree (Normal): ₹150 | Saree (Worked/Heavy/Designer): ₹200
  * Lehenga: ₹200 | Sherwani: ₹150 - ₹300
  * Blanket Single: ₹200 | Blanket Double: ₹300
  * Quilt/Rajai Single: ₹150 | Quilt Double: ₹250
  * Bed Sheet Single: ₹40 | Bed Sheet Double: ₹60
  * Shirt: ₹30 | Jeans/Pant: ₹30
  * For any unlisted or special garment, ask them to contact the shop at 9151517444.

BEHAVIOR AND TONE RULES:
1. Speak in the same language and style as the customer:
   - If customer asks in Hindi or Bundelkhandi/Hinglish (e.g. "saree dry hone me kitna time lagta hai", "rate kitna hai"), respond in warm, polite, natural Hindi / Hinglish.
   - If customer asks about HOW MUCH TIME IT TAKES (Turnaround time), explain clearly: 2-3 days normally, or 24 hours for urgent! Do NOT confuse turnaround time with shop opening/closing hours.
2. Keep replies formatted for WhatsApp: concise, easy to read on a mobile phone (2-4 short sentences or clean bullet points), using helpful emojis (✨, 📍, 🕒, 📞, 💰).
3. If customer is complaining, reports damaged/burnt clothes, or asks for refund:
   - Immediately apologize politely and provide the Owner/Manager direct contact: "📞 9151517444 (1st Floor, Shukwari Bazar, Mahoba)" for prompt personal resolution. Never argue.
4. Sign off naturally with "— आयशा (My Mercury Dry Cleaners)" or "— Aisha 😊".
`;

async function callGemini(userMessage, apiKey) {
  // Official, verified Google AI Studio API model endpoints
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350
          }
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply && reply.trim()) {
        return reply.trim();
      }
    } catch (err) {
      // Continue to next model
    }
  }
  return null;
}

async function callGroq(userMessage, apiKey) {
  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 350
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (reply && reply.trim()) {
      return reply.trim();
    }
  } catch (err) {
    // Continue
  }
  return null;
}

/**
 * Main AI Query Router
 * Tries Groq (fastest 0.5s) / Gemini (best multilingual), falls back gracefully
 */
async function generateSmartReply(userMessage) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Try Groq first if available (instant 0.5s response)
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
