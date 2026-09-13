// conversation.js
// Intelligent WhatsApp Business Assistant for My Mercury Dry Cleaners, Mahoba
// Powered by Multi-Provider AI (Google Gemini 2.0 Flash / Groq Llama 3.3)
// with zero-latency Instant Fallback to Local Smart NLP & Price Search

const fs = require("fs");
const path = require("path");
const { generateSmartReply } = require("./ai-service");

const sessions = new Map(); // key: customer phone number, value: session object

// ---------------------------------------------------------------------
// Authentic Business Information (Mahoba)
// ---------------------------------------------------------------------
const SHOP_NAME = "My Mercury Dry Cleaners";
const SHOP_PHONE = "9151517444";
const AI_PHONE = "8004430989";
const SHOP_MAPS_URL = "https://share.google/Q0mAqoZ8PLpFLUK5a";
const SHOP_ADDRESS_SHORT = "1st Floor, In front of Shukwari Bazar, Mahoba";
const SHOP_ADDRESS_FULL =
  "1st Floor, In front of Shukwari Bazar, Near Old Private Bus Stand, Mahoba, Uttar Pradesh - 210427";

const SHOP_TIMING_TEXT =
  `🕒 *दुकान का समय (Shop Timing)*\n\n` +
  `• *सोमवार – शनिवार:* सुबह 09:30 AM से रात 08:30 PM\n` +
  `• *रविवार (Sunday):* सुबह 10:00 AM से रात 08:00 PM\n\n` +
  `📍 *स्थान:* ${SHOP_ADDRESS_SHORT}\n` +
  `📞 *कॉल / पूछताछ:* ${SHOP_PHONE}`;

const DELIVERY_TIME_TEXT =
  `🕒 *कपड़े तैयार होने का समय (Delivery & Processing Time)*\n\n` +
  `• *सामान्य दिनों में (Normal Days):* 3 से 4 दिन\n` +
  `• *शादी के सीज़न / भारी वर्कलोड में:* 4 से 5 दिन (काम के अनुसार)\n\n` +
  `⚠️ *विशेष सूचना:* खराब मौसम (जैसे बारिश/धूप न होना), बिजली सप्लाई की समस्या या किसी दुर्लभ तकनीकी/मशीनरी खराबी की स्थिति में थोड़ा अतिरिक्त समय (विलंब) लग सकता है।\n\n` +
  `⚡ *अर्जेंट डिलीवरी:* यदि आपको कपड़े बहुत जल्दी/इमरजेंसी में चाहिए, तो सीधे संपर्क करें: *${SHOP_PHONE}*`;

const SHOP_LOCATION_TEXT =
  `📍 *हमारा पता (Our Location)*\n\n` +
  `*${SHOP_NAME}* (Since 1980)\n` +
  `46+ वर्षों का अटूट विश्वास ✨\n\n` +
  `🏢 *पूरा पता:*\n${SHOP_ADDRESS_FULL}\n` +
  `*(शुक्रवारी बाज़ार के सामने, पुराने प्राइवेट बस स्टैंड के पास)*\n\n` +
  `🗺️ *Google Maps पर लोकेशन देखें:*\n${SHOP_MAPS_URL}\n\n` +
  `📞 दुकान पर संपर्क करें: ${SHOP_PHONE}`;

const SERVICES_TEXT =
  `🧺 *हमारी मुख्य सेवाएं (Our Services)*\n\n` +
  `✨ *Professional Dry Cleaning* — कोट, ब्लेज़र, सूट, शेरवानी, पैंट, शर्ट\n` +
  `✨ *Saree Care & Roll Press* — सिल्क, ज़री, बनारसी व पार्टीवियर साड़ियां\n` +
  `✨ *Bridal & Wedding Wear* — लहंगा-चोली, दुल्हन के जोड़े व भारी परिधान\n` +
  `✨ *Winter Care* — कंबल (Single/Double), रजाई, जैकेट, स्वेटर\n` +
  `✨ *Steam Finishing* — आधुनिक स्टीम प्रेस एवं प्रोफेशनल पैकिंग\n` +
  `✨ *Doorstep Pickup & Delivery* — महोबा शहर में घर बैठे पिकअप सुविधा\n\n` +
  `👉 किसी भी कपड़े का रेट जानने के लिए उसका नाम लिखें (उदा. *saree*, *blazer*, *blanket*) या *4* दबाकर पूरी रेट लिस्ट देखें।`;

const PICKUP_DELIVERY_TEXT =
  `🚚 *होम पिकअप व डिलीवरी (Doorstep Pickup & Delivery)*\n\n` +
  `महोबा शहर में आपके घर या दुकान से कपड़े पिकअप करने की सुविधा उपलब्ध है!\n\n` +
  `📲 पिकअप बुक करने के लिए:\n` +
  `1️⃣ सीधे कॉल या WhatsApp करें: *${SHOP_PHONE}*\n` +
  `2️⃣ या Play Store से हमारी Android App (*"${SHOP_NAME}"*) का उपयोग करें।\n\n` +
  `📞 अभी संपर्क करें: ${SHOP_PHONE}`;

const ESCALATION_TEXT =
  `🙏 *ग्राहक सहायता (Customer Support / Manager Desk)*\n\n` +
  `आपकी संतुष्टि ही हमारी सर्वोच्च प्राथमिकता है। किसी भी शिकायत, विशेष अनुरोध या जरूरी बात के लिए हमारे ओनर/मैनेजर से सीधे संपर्क करें:\n\n` +
  `📞 कॉल / WhatsApp: *${SHOP_PHONE}*\n` +
  `📍 1st Floor, शुकwari Bazar, Mahoba\n\n` +
  `हम तुरंत आपकी समस्या का उचित समाधान करेंगे।`;

// Load Dry Cleaning price list
let PRICE_DATA = {};
try {
  const rawPrices = fs.readFileSync(path.join(__dirname, "prices.json"), "utf-8").replace(/^\uFEFF/, '');
  PRICE_DATA = JSON.parse(rawPrices);
} catch (e) {
  console.error("Error loading prices.json:", e.message);
  PRICE_DATA = { Men: [], Women: [], Kids: [], Household: [], Institutional: [], Others: [] };
}
const CATEGORY_KEYS = Object.keys(PRICE_DATA);

const ORDER_STATUS_LOOKUP = {};

// ---------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------
function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, { step: "menu" });
  }
  return sessions.get(phone);
}

function resetSession(phone) {
  sessions.set(phone, { step: "menu" });
}

// ---------------------------------------------------------------------
// Fallback NLP & Garment Search
// ---------------------------------------------------------------------
const HINDI_MAP = {
  "साड़ी": "saree",
  "साडी": "saree",
  "लहंगा": "lehenga",
  "लहँगा": "lehenga",
  "कोट": "coat",
  "सूट": "suit",
  "ब्लेज़र": "blazer",
  "ब्लेजर": "blazer",
  "कंबल": "blanket",
  "कम्बल": "blanket",
  "रजाई": "blanket",
  "शर्ट": "shirt",
  "पैंट": "pant",
  "पेंट": "pant",
  "जींस": "jeans",
  "कुर्ता": "kurta",
  "शेरवानी": "sherwani",
  "पर्दा": "curtain",
  "पर्दे": "curtain",
  "चादर": "bed sheet"
};

const SYNONYMS = {
  coat: ["coat", "blazer"],
  kot: ["coat", "blazer"],
  blazer: ["blazer"],
  sari: ["saree"],
  saree: ["saree"],
  lahnga: ["lehenga"],
  lehnga: ["lehenga"],
  lehenga: ["lehenga"],
  kambal: ["blanket"],
  quilt: ["blanket"],
  rajai: ["blanket"],
  chadar: ["bed sheet"],
  bedsheet: ["bed sheet"],
  parda: ["curtain"],
  curtain: ["curtain"],
  sherwani: ["sherwani"],
  kurta: ["kurta"],
  pyjama: ["pajama"],
  pajama: ["pajama"],
  pant: ["pant", "jeans"],
  shirt: ["shirt"],
  jacket: ["jacket"],
  suit: ["suit"],
  blanket: ["blanket"]
};

const STOP_WORDS = new Set([
  "ka", "ki", "ke", "kya", "hai", "hain", "ko", "se", "me", "mein", "par",
  "rate", "rates", "price", "prices", "charge", "charges", "kitna", "kitne",
  "cost", "dry", "clean", "dryclean", "cleaning", "wash", "washing", "iron",
  "press", "please", "batao", "bataye", "bataiye", "bhaiya", "sir", "mam",
  "for", "the", "a", "an", "and", "in", "to", "do", "karo", "karna",
  "shop", "dukan", "dukaan", "on", "your", "aapki", "apki", "humari", "hamari", "at", "of", "is", "are"
]);

function normalizeInput(rawText) {
  let text = (rawText || "").trim();
  for (const [hindiWord, engWord] of Object.entries(HINDI_MAP)) {
    if (text.includes(hindiWord)) {
      text += " " + engWord;
    }
  }
  return text;
}

function searchGarment(rawQuery) {
  const normalized = normalizeInput(rawQuery).toLowerCase();
  const words = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (words.length === 0) return [];

  let searchTerms = [];
  for (const w of words) {
    searchTerms.push(w);
    if (SYNONYMS[w]) searchTerms.push(...SYNONYMS[w]);
  }
  searchTerms = [...new Set(searchTerms)];

  const matched = [];
  for (const cat of CATEGORY_KEYS) {
    const items = PRICE_DATA[cat] || [];
    for (const item of items) {
      const gName = (item.garment || "").toLowerCase();
      let score = 0;
      for (const term of searchTerms) {
        if (gName === term) {
          score = Math.max(score, 100);
        } else if (new RegExp("\\b" + term + "\\b", "i").test(gName)) {
          score = Math.max(score, 80);
        } else if (gName.startsWith(term)) {
          score = Math.max(score, 60);
        } else if (gName.includes(term) && term.length > 3) {
          score = Math.max(score, 40);
        }
      }
      if (score > 0) {
        matched.push({ category: cat, garment: item.garment, price: item.price, score });
      }
    }
  }

  matched.sort((a, b) => b.score - a.score || a.price - b.price);

  // Deduplicate exact same garment name, category, and price
  const seen = new Set();
  const unique = [];
  for (const m of matched) {
    const key = `${m.garment.toLowerCase().trim()}_${m.category.toLowerCase().trim()}_${m.price}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  }

  return unique.slice(0, 15);
}

function formatMatches(matches) {
  if (matches.length === 1) {
    const m = matches[0];
    const priceText = m.price && m.price > 0 ? `₹${m.price}` : "रेट के लिए संपर्क करें";
    return (
      `💰 *रेट विवरण (Price Details):*\n\n` +
      `• *${m.garment}* (${m.category}): ${priceText}\n\n` +
      `📍 ${SHOP_NAME}, Mahoba | 📞 ${SHOP_PHONE}`
    );
  }

  const validPrices = matches.filter((m) => m.price && m.price > 0).map((m) => m.price);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
  const priceRange = (minPrice && maxPrice)
    ? (minPrice === maxPrice ? `(₹${minPrice})` : `(₹${minPrice} से ₹${maxPrice})`)
    : "";

  let text = `💰 *ड्राई क्लीनिंग रेट लिस्ट ${priceRange}:*\n\n`;
  matches.forEach((m) => {
    const priceText = m.price && m.price > 0 ? `₹${m.price}` : "संपर्क करें";
    text += `• *${m.garment}* (${m.category}): ${priceText}\n`;
  });
  text += `\n📞 किसी अन्य कपड़े या वैरायटी के रेट के लिए संपर्क करें: *${SHOP_PHONE}*`;
  return text.trim();
}

function handleLocalRules(phone, text, lower, session) {
  // 1. Delivery & Processing Turnaround Time (kitna time lagta hai / kab milega)
  const deliveryWords = [
    "kitna time", "kitne din", "kitna din", "kab tak", "kab milega",
    "ready", "hone me", "hone mein", "lagta hai", "lagega", "lete ho",
    "lete hain", "delivery time", "tayyar", "kitne ghante", "urgent delivery",
    "tatkal", "turnaround"
  ];
  if (deliveryWords.some((w) => lower.includes(w))) {
    return [DELIVERY_TIME_TEXT, ...menuFooter()];
  }

  // 2. Garment Price Search FIRST (so questions like "lehenga prices on your shop" return prices)
  const matches = searchGarment(text);
  if (matches.length > 0) {
    return [formatMatches(matches), ...menuFooter()];
  }

  // 3. General rate inquiry (without specific garment match)
  const generalRateTriggers = ["rate", "rates", "price", "prices", "charge", "charges", "cost", "kitna"];
  if (generalRateTriggers.some((r) => lower.includes(r))) {
    session.step = "price_menu";
    return [
      "हमारे यहाँ सभी प्रकार के कपड़ों की ड्राई क्लीनिंग व स्टीम प्रेसिंग उपलब्ध है।\n\n" +
      priceCategoryMenuText()
    ];
  }

  // 4. Shop Opening / Closing Timings (Must be asking about shop operating hours)
  if (
    lower.includes("timing") || lower.includes("samay") ||
    lower.includes("kab khult") || lower.includes("kab khuleg") || lower.includes("kab band") ||
    lower.includes("khula hai") || lower.includes("kholte") || lower.includes("aaj open") ||
    lower.includes("chhutti") || lower.includes("working hour") || lower.includes("opening")
  ) {
    return [SHOP_TIMING_TEXT, ...menuFooter()];
  }

  // 5. Location & Address (Must be asking for location/address/directions)
  const locationWords = [
    "location", "address", "pata", "kahan", "kaha", "kidhar", "map",
    "directions", "rasta", "kaise aaye", "kaise pahunche"
  ];
  const isDirectShopInquiry = lower === "shop" || lower === "dukan" || lower === "dukaan" || lower.includes("bus stand") || lower.includes("shukwari");
  if (locationWords.some((w) => lower.includes(w)) || isDirectShopInquiry) {
    return [SHOP_LOCATION_TEXT, ...menuFooter()];
  }

  // 6. Pickup & Delivery
  if (
    lower.includes("pickup") || lower.includes("pick up") || lower.includes("delivery") ||
    lower.includes("ghar se") || lower.includes("home delivery") || lower.includes("doorstep") ||
    lower.includes("mangwana") || lower.includes("bhejna")
  ) {
    return [PICKUP_DELIVERY_TEXT, ...menuFooter()];
  }

  // 7. General Services
  if (
    lower === "services" || lower === "service" || lower.includes("kya kya") ||
    lower.includes("facilities") || lower.includes("suvidha") || lower.includes("steam press") ||
    lower.includes("laundry") || lower.includes("roll press") || lower.includes("charak")
  ) {
    return [SERVICES_TEXT, ...menuFooter()];
  }

  return [
    "क्षमा करें, मुझे यह समझ नहीं आया। 😊\n\n" +
    "कृपया नीचे दिए गए मेन्यू में से कोई नंबर (1-7) चुनें, या किसी कपड़े का नाम (उदा. *saree*, *lehenga*, *blazer*, *blanket*) लिखकर रेट पूछें:",
    ...greetingAndMenu()
  ];
}

// ---------------------------------------------------------------------
// Main Message Handler (Async with AI + Local Fallback)
// ---------------------------------------------------------------------
async function handleMessage(phone, rawText) {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();
  const session = getSession(phone);

  // 1. Critical safety escalation triggers
  const escalationTriggers = [
    "damage", "torn", "kharaab", "kharab", "jala", "burnt", "color fade",
    "rang chhut", "refund", "paisa wapas", "police", "court", "case",
    "complaint", "shikayat", "chor", "fraud", "owner se baat", "manager"
  ];
  if (escalationTriggers.some((t) => lower.includes(t))) {
    resetSession(phone);
    return [ESCALATION_TEXT, ...menuFooter()];
  }

  // 2. Exact numbered menu choices
  if (text === "1") return [SHOP_TIMING_TEXT, ...menuFooter()];
  if (text === "2") return [SHOP_LOCATION_TEXT, ...menuFooter()];
  if (text === "3") return [SERVICES_TEXT, ...menuFooter()];
  if (text === "4") {
    session.step = "price_menu";
    return [priceCategoryMenuText()];
  }
  if (text === "5") return [PICKUP_DELIVERY_TEXT, ...menuFooter()];
  if (text === "6") {
    session.step = "awaiting_order_number";
    return [
      "📦 *आर्डर स्टेटस चेक (Order Status)*\n\n" +
      "कृपया अपना *Order Number* या *Bill Number* टाइप करके भेजें (उदा. ORD101 या 1052):"
    ];
  }
  if (text === "7") return [ESCALATION_TEXT, ...menuFooter()];

  // 3. Greetings & Menu triggers
  const greetingTriggers = [
    "hi", "hello", "hey", "hlo", "namaste", "namaskar", "pranam",
    "radhe radhe", "ram ram", "start", "menu", "help", "madad",
    "shuru", "aisha", "sunona"
  ];
  if (greetingTriggers.includes(lower) || lower === "0") {
    resetSession(phone);
    return greetingAndMenu();
  }

  // 4. Sub-step handling
  if (session.step === "awaiting_order_number") {
    const orderNumber = text.toUpperCase();
    const status = ORDER_STATUS_LOOKUP[orderNumber];
    resetSession(phone);

    if (status) {
      return [
        `📦 *Order ${orderNumber} Status:*\n\n✅ ${status}\n\n📍 ${SHOP_NAME}, Mahoba\n📞 संपर्क: ${SHOP_PHONE}`,
        ...menuFooter()
      ];
    }
    return [
      `📦 *Order ${orderNumber} Status:*\n\n` +
      `हमने आपका आर्डर नंबर नोट कर लिया है। हमारी टीम तुरंत आपके आर्डर की स्थिति चेक कर आपको अपडेट करेगी।\n\n` +
      `📞 तत्काल जानकारी के लिए आप दुकान पर सीधे कॉल भी कर सकते हैं: *${SHOP_PHONE}*`,
      ...menuFooter()
    ];
  }

  if (session.step === "price_menu") {
    const categoryIndex = parseInt(text, 10);
    if (!isNaN(categoryIndex) && categoryIndex >= 1 && categoryIndex <= CATEGORY_KEYS.length) {
      const category = CATEGORY_KEYS[categoryIndex - 1];
      session.step = "menu";
      const listResult = categoryPriceListText(category);
      const listMessages = Array.isArray(listResult) ? listResult : [listResult];
      return [...listMessages, ...menuFooter()];
    }
  }

  // 5. Intelligent AI Response (Gemini 2.0 Flash / Groq Llama 3.3)
  try {
    const aiReply = await generateSmartReply(text);
    if (aiReply && aiReply.trim()) {
      return [aiReply.trim(), ...menuFooter()];
    }
  } catch (err) {
    console.warn("AI generation note:", err.message);
  }

  // 6. Seamless Local NLP & Garment Search fallback
  return handleLocalRules(phone, text, lower, session);
}

// ---------------------------------------------------------------------
// Menu Text Helpers
// ---------------------------------------------------------------------
function menuFooter() {
  return ["मेन मेन्यू के लिए कभी भी *Menu* लिखकर भेजें। — आयशा (Aisha) 😊"];
}

function greetingAndMenu() {
  return [
    `👋 नमस्ते! मैं *आयशा (Aisha)* हूँ — आपकी डिजिटल असिस्टेंट at *${SHOP_NAME}*, Mahoba (Since 1980).\n\n` +
    `हम आपकी किस प्रकार सहायता कर सकते हैं? कृपया किसी विकल्प का नंबर रिप्लाई करें:\n\n` +
    `1️⃣ 🕒 दुकान का समय (Shop Timing)\n` +
    `2️⃣ 📍 दुकान का पता व मैप (Location & Map)\n` +
    `3️⃣ 🧺 हमारी सेवाएं (Our Services)\n` +
    `4️⃣ 💰 रेट लिस्ट (Price List)\n` +
    `5️⃣ 🚚 होम पिकअप व डिलीवरी (Pickup & Delivery)\n` +
    `6️⃣ 📦 आर्डर का स्टेटस (Check Order Status)\n` +
    `7️⃣ 📞 ओनर से बात करें (Contact Owner / Manager)\n\n` +
    `💡 *सुझाव:* आप सीधे किसी कपड़े का नाम (उदा. *"saree"*, *"blazer"*, *"kambal"*) या अपना कोई भी सवाल पूछ सकते हैं!`
  ];
}

function priceCategoryMenuText() {
  let text = "💰 *रेट लिस्ट — Dry Cleaning Price List*\n\nकैटेगरी देखने के लिए नंबर चुनें:\n\n";
  CATEGORY_KEYS.forEach((cat, i) => {
    text += `${i + 1}️⃣ ${cat}\n`;
  });
  text += "\nया सीधे किसी कपड़े का नाम टाइप करें (उदा. *saree*, *blazer*, *suit*, *blanket*).";
  return text;
}

function categoryPriceListText(category) {
  const items = PRICE_DATA[category] || [];
  const MAX_ITEMS_PER_MESSAGE = 25;
  const lines = items.map((item) => {
    const priceText = item.price && item.price > 0 ? `₹${item.price}` : "संपर्क करें";
    return `• ${item.garment}: ${priceText}`;
  });

  if (lines.length <= MAX_ITEMS_PER_MESSAGE) {
    return `💰 *${category} — Dry Cleaning Prices*\n\n${lines.join("\n")}`;
  }

  const chunks = [];
  for (let i = 0; i < lines.length; i += MAX_ITEMS_PER_MESSAGE) {
    chunks.push(lines.slice(i, i + MAX_ITEMS_PER_MESSAGE));
  }
  return chunks.map((chunk, idx) => {
    const header = `💰 *${category} — Dry Cleaning Prices* (${idx + 1}/${chunks.length})`;
    return `${header}\n\n${chunk.join("\n")}`;
  });
}

module.exports = {
  handleMessage,
  searchGarment,
  SHOP_NAME,
  SHOP_PHONE,
  AI_PHONE,
  SHOP_TIMING_TEXT,
  SHOP_LOCATION_TEXT
};
