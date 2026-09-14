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
const SHOP_MAPS_URL = "https://maps.app.goo.gl/xxveghHtvhFcEq65A";
const SHOP_ADDRESS_SHORT = "1st Floor, In front of Shukwari Bazar, Mahoba";
const SHOP_ADDRESS_FULL =
  "1st Floor, In front of Shukwari Bazar, Near Old Private Bus Stand, Mahoba, Uttar Pradesh - 210427";

const SHOP_TIMING_TEXT =
  `🕒 *दुकान का समय (Shop Operating Hours)*\n\n` +
  `• *सोमवार – शनिवार:* सुबह 09:30 AM से रात 08:30 PM\n` +
  `• *रविवार (Sunday):* सुबह 10:00 AM से रात 08:00 PM\n\n` +
  `📍 *स्थान:* ${SHOP_ADDRESS_SHORT}\n` +
  `📞 *कॉल / पूछताछ:* ${SHOP_PHONE}`;

const DELIVERY_TIME_TEXT =
  `⏱️ *कपड़े तैयार होने का समय (Delivery & Processing Turnaround)*\n\n` +
  `• 🌿 *सामान्य दिनों में (Normal Days):* 3 से 4 दिन\n` +
  `• 👑 *शादी के सीज़न / भारी वर्कलोड में:* 4 से 5 दिन (काम की बारीकी के अनुसार)\n\n` +
  `⚠️ *संभावित विलंब सूचना:* अत्यधिक बारिश/खराब मौसम (धूप न होने पर कपड़े सुखाने में अतिरिक्त समय), बिजली आपूर्ति में बाधा या मशीनरी के दुर्लभ तकनीकी मेंटेनेंस की स्थिति में थोड़ा अतिरिक्त समय लग सकता है।\n\n` +
  `⚡ *अर्जेंट डिलीवरी (Emergency Service):* यदि आपको कपड़े बहुत जल्दी चाहिए, तो सीधे संपर्क करें: *${SHOP_PHONE}*`;

const SHOP_LOCATION_TEXT =
  `📍 *हमारा पता (Our Location)*\n\n` +
  `*${SHOP_NAME}* (Since 1980)\n` +
  `46+ वर्षों का अटूट विश्वास ✨\n\n` +
  `🏢 *पूरा पता:*\n${SHOP_ADDRESS_FULL}\n` +
  `*(शुक्रवारी बाज़ार के सामने, पुराने प्राइवेट बस स्टैंड के पास)*\n\n` +
  `🗺️ *Google Maps पर लोकेशन देखें:*\n${SHOP_MAPS_URL}\n\n` +
  `📞 *दुकान पर संपर्क करें:* ${SHOP_PHONE}`;

const SERVICES_TEXT =
  `🧺 *हमारी मुख्य सेवाएं (Our Services)*\n\n` +
  `✨ *Professional Dry Cleaning* — कोट, ब्लेज़र, सूट, शेरवानी, पैंट, शर्ट\n` +
  `👗 *Saree Care & Roll Press* — सिल्क, ज़री, बनारसी व पार्टीवियर साड़ियां\n` +
  `👑 *Bridal & Wedding Wear* — लहंगा-चोली, दुल्हन के जोड़े व भारी परिधान\n` +
  `🛏️ *Winter Care* — कंबल (Single/Double), रजाई, जैकेट, स्वेटर\n` +
  `👔 *Steam Finishing* — आधुनिक स्टीम प्रेस एवं प्रोफेशनल पैकिंग\n` +
  `🚚 *Doorstep Pickup & Delivery* — महोबा शहर में घर बैठे पिकअप सुविधा\n\n` +
  `👉 किसी भी कपड़े का रेट जानने के लिए उसका नाम लिखें (उदा. *saree*, *lehenga*, *blazer*, *blanket*) या *4* दबाकर पूरी रेट लिस्ट देखें।`;

const PICKUP_DELIVERY_TEXT =
  `🚚 *होम पिकअप व डिलीवरी (Doorstep Pickup & Delivery)*\n\n` +
  `महोबा शहर में आपके घर या दुकान से कपड़े पिकअप करने की सुविधा उपलब्ध है!\n\n` +
  `📲 पिकअप बुक करने के लिए:\n` +
  `1️⃣ सीधे कॉल या WhatsApp करें: *${SHOP_PHONE}*\n` +
  `2️⃣ या Play Store से हमारी Android App (*"${SHOP_NAME}"*) का उपयोग करें।\n\n` +
  `📞 अभी संपर्क करें: ${SHOP_PHONE}`;

const ESCALATION_TEXT =
  `🙏 *ग्राहक सहायता (Customer Support / Manager Desk)*\n\n` +
  `आपकी संतुष्टि ही हमारी सर्वोच्च प्राथमिकता है। किसी भी शिकायत, विशेष अनुरोध या सहायता के लिए हमारे मैनेजर डेस्क से सीधे संपर्क करें:\n\n` +
  `📞 कॉल / WhatsApp: *${SHOP_PHONE}*\n` +
  `📍 1st Floor, In front of Shukwari Bazar, Mahoba\n\n` +
  `हम तुरंत आपकी समस्या का उचित समाधान करेंगे।`;

const CLOSING_TEXT =
  `🙏✨ *My Mercury Dry Cleaners चुनने के लिए आपका हृदय से धन्यवाद!*\n\n` +
  `यदि आपको कपड़ों की ड्राई क्लीनिंग, स्टीम प्रेसिंग या होम पिकअप से संबंधित कोई अन्य सहायता चाहिए, तो हम सदैव आपकी सेवा में उपलब्ध हैं।\n\n` +
  `🌸 *आपका दिन शुभ और मंगलमय हो!* — आयशा (Aisha) 😊`;

const CLOSING_TRIGGERS = [
  "thank you", "thanks", "dhanyawad", "dhanyavad", "shukriya",
  "ok", "okay", "theek hai", "thik hai", "thik h", "accha", "achha", "achha h",
  "samajh gaya", "samajh gya", "samajh gye", "done", "got it", "bye", "alvida",
  "badhiya", "bahut achha", "bahut badhiya", "kripya", "shukran", "no thanks",
  "ok thanks", "theek hai thanks", "thik hai ji", "ok ji", "theek h ji"
];

// Load Dry Cleaning price list
let PRICE_DATA = {};
try {
  const rawPrices = fs.readFileSync(path.join(__dirname, "prices.json"), "utf-8").replace(/^\uFEFF/, '');
  PRICE_DATA = JSON.parse(rawPrices);
} catch (e) {
  console.error("Error loading prices.json:", e.message);
  PRICE_DATA = { Men: [], Women: [], Kids: [], Household: [], Institutional: [], Others: [] };
}

const ORDERED_CATEGORIES = [
  {
    key: "Women",
    icon: "👗",
    label: "👗 महिलाएं व ब्राइडल (Women — साड़ी, लहंगा, सूट, गाउन)",
    synonyms: ["women", "woman", "ladies", "lady", "mahila", "aurat", "female", "sadi", "saree", "lehenga", "bridal", "anarkali", "blouse", "kurti"]
  },
  {
    key: "Men",
    icon: "👔",
    label: "👔 पुरुष (Men — कोट, ब्लेज़र, सूट, शेरवानी, पैंट)",
    synonyms: ["men", "man", "gents", "gent", "purush", "male", "blazer", "coat", "suit", "sherwani", "kurta", "safari"]
  },
  {
    key: "Kids",
    icon: "👶",
    label: "👶 बच्चे (Kids — फ्रॉक, कोट, शेरवानी, लहंगे)",
    synonyms: ["kids", "kid", "bachhe", "bacha", "children", "child", "boy", "girl"]
  },
  {
    key: "Household",
    icon: "🛏️",
    label: "🛏️ घरेलू व विंटर (Household — कंबल, रज़ाई, चादर, पर्दे)",
    synonyms: ["household", "home", "gharelu", "kambal", "blanket", "quilt", "rajai", "curtain", "bedsheet"]
  },
  {
    key: "Institutional",
    icon: "🏥",
    label: "🏥 अन्य / इंस्टीट्यूशनल (Institutional — डॉक्टर कोट, वर्दी)",
    synonyms: ["institutional", "doctor", "uniform", "hospital", "hotel", "other", "others"]
  }
];

const CATEGORY_KEYS = ORDERED_CATEGORIES.map((c) => c.key);

function findCategory(input) {
  if (!input) return null;
  const clean = input.toLowerCase().trim();
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 1 && num <= ORDERED_CATEGORIES.length) {
    return ORDERED_CATEGORIES[num - 1].key;
  }
  for (const cat of ORDERED_CATEGORIES) {
    if (cat.key.toLowerCase() === clean) return cat.key;
    if (cat.synonyms.some((s) => clean === s || clean.includes(s))) return cat.key;
  }
  return null;
}

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

function getGarmentEmoji(garmentName, category) {
  const g = (garmentName || "").toLowerCase();
  const c = (category || "").toLowerCase();
  if (g.includes("lehenga") || g.includes("saree") || g.includes("gown") || g.includes("anarkali") || g.includes("dupatta") || c === "women") {
    return "👗";
  }
  if (g.includes("blazer") || g.includes("coat") || g.includes("suit") || g.includes("sherwani") || g.includes("jacket") || g.includes("safari") || c === "men") {
    return "👔";
  }
  if (g.includes("blanket") || g.includes("kambal") || g.includes("quilt") || g.includes("rajai") || g.includes("sheet") || g.includes("curtain") || c === "household") {
    return "🛏️";
  }
  return "🏷️";
}

function formatMatches(matches) {
  const firstEmoji = getGarmentEmoji(matches[0]?.garment, matches[0]?.category);
  if (matches.length === 1) {
    const m = matches[0];
    const priceText = m.price && m.price > 0 ? `₹${m.price}` : "रेट के लिए संपर्क करें";
    return (
      `${firstEmoji} *रेट विवरण (Price Details):*\n\n` +
      `• *${m.garment}* (${m.category}): *${priceText}*\n\n` +
      `📍 *स्थान:* ${SHOP_ADDRESS_SHORT}\n` +
      `📞 *बुकिंग व संपर्क:* ${SHOP_PHONE}`
    );
  }

  const validPrices = matches.filter((m) => m.price && m.price > 0).map((m) => m.price);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
  const priceRange = (minPrice && maxPrice)
    ? (minPrice === maxPrice ? `(₹${minPrice})` : `(₹${minPrice} से ₹${maxPrice})`)
    : "";

  let text = `${firstEmoji}✨ *ड्राई क्लीनिंग रेट लिस्ट ${priceRange}:*\n\n`;
  matches.forEach((m) => {
    const emoji = getGarmentEmoji(m.garment, m.category);
    const priceText = m.price && m.price > 0 ? `₹${m.price}` : "संपर्क करें";
    text += `${emoji} *${m.garment}* (${m.category}): *${priceText}*\n`;
  });
  text += `\n📞 *दुकान पर संपर्क या होम पिकअप:* *${SHOP_PHONE}*`;
  return text.trim();
}

function handleLocalRules(phone, text, lower, session) {
  // 1. Delivery & Processing Turnaround Time (kitna time lagta hai / kab milega)
  const deliveryWords = [
    "kitna time", "kitne din", "kitna din", "kab tak", "kab milega",
    "delivery time", "kitne ghante", "urgent delivery", "tatkal", "turnaround",
    "ready kab", "kab ready", "kitna samay", "samay lagega", "time lagta", "time lagega"
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

  // 8. Direct Category Inquiry (e.g. user types "women", "ladies", "men", "kids", "kambal")
  const directCat = findCategory(text);
  if (directCat) {
    const listResult = categoryPriceListText(directCat);
    const listMessages = Array.isArray(listResult) ? listResult : [listResult];
    return [...listMessages, ...menuFooter()];
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

  // 2. Customer Satisfaction / Wrap-up / Thank You
  if (
    CLOSING_TRIGGERS.includes(lower) ||
    lower === "ok thanks" ||
    lower === "ok thank you" ||
    lower === "theek hai thanks" ||
    lower === "thik h bhaiya" ||
    lower === "thik hai bhaiya" ||
    lower.startsWith("thank") ||
    lower.startsWith("dhanya")
  ) {
    resetSession(phone);
    return [CLOSING_TEXT];
  }

  // 3. Greetings & Menu triggers (Always resets to main menu)
  const greetingTriggers = [
    "hi", "hello", "hey", "hlo", "namaste", "namaskar", "pranam",
    "radhe radhe", "ram ram", "start", "menu", "help", "madad",
    "shuru", "aisha", "sunona"
  ];
  if (greetingTriggers.includes(lower) || lower === "0") {
    resetSession(phone);
    return greetingAndMenu();
  }

  // 4. Active Sub-Step Handling (Must run before top-level numbered choices)
  if (session.step === "price_menu") {
    const matchedCategory = findCategory(text);
    if (matchedCategory) {
      session.step = "menu";
      const listResult = categoryPriceListText(matchedCategory);
      const listMessages = Array.isArray(listResult) ? listResult : [listResult];
      return [...listMessages, ...menuFooter()];
    }
  }

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

  // 5. Main Numbered Menu Choices (1-7)
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

  // 5. Intelligent AI Response (Gemini 2.0 Flash / Groq Llama 3.3)
  try {
    const aiReply = await generateSmartReply(text);
    if (aiReply && aiReply.trim()) {
      return [aiReply.trim()];
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
    `🙏 नमस्ते! आपका स्वागत है *${SHOP_NAME}*, Mahoba (Since 1980 — 46+ वर्षों का अटूट विश्वास ✨) में।\n\n` +
    `मैं आपकी डिजिटल असिस्टेंट *आयशा (Aisha)* हूँ। बताइए, आज मैं आपकी क्या सहायता कर सकती हूँ?\n\n` +
    `1️⃣ 🕒 दुकान का समय (Shop Timings)\n` +
    `2️⃣ 📍 दुकान का पता व मैप (Location & Map)\n` +
    `3️⃣ 🧺 हमारी सेवाएं (Our Services)\n` +
    `4️⃣ 💰 रेट लिस्ट (Price List)\n` +
    `5️⃣ 🚚 होम पिकअप व डिलीवरी (Doorstep Pickup)\n` +
    `6️⃣ 📦 आर्डर स्टेटस (Check Order Status)\n` +
    `7️⃣ 📞 मैनेजर डेस्क (Contact Manager Desk)\n\n` +
    `💡 *सुझाव:* आप सीधे किसी भी कपड़े का नाम (उदा. *"saree"*, *"lehenga"*, *"blazer"*, *"kambal"*) या अपना कोई भी सवाल पूछ सकते हैं!`
  ];
}

function priceCategoryMenuText() {
  let text = "💰 *रेट लिस्ट — Dry Cleaning Price List*\n\nकैटेगरी देखने के लिए नंबर (1-5) या नाम चुनें:\n\n";
  ORDERED_CATEGORIES.forEach((cat, i) => {
    text += `${i + 1}️⃣ ${cat.label}\n`;
  });
  text += "\n💡 *या सीधे किसी कपड़े का नाम टाइप करें* (उदा. *saree*, *lehenga*, *blazer*, *blanket*).";
  return text;
}

function categoryPriceListText(category) {
  const items = PRICE_DATA[category] || [];
  const catObj = ORDERED_CATEGORIES.find((c) => c.key === category);
  const icon = catObj ? catObj.icon : "🏷️";
  const label = catObj ? catObj.label : category;
  const MAX_ITEMS_PER_MESSAGE = 25;
  const lines = items.map((item) => {
    const priceText = item.price && item.price > 0 ? `₹${item.price}` : "संपर्क करें";
    return `${icon} *${item.garment}*: *${priceText}*`;
  });

  if (lines.length <= MAX_ITEMS_PER_MESSAGE) {
    return `💰 *${label} — रेट लिस्ट*\n\n${lines.join("\n")}\n\n📞 *दुकान पर संपर्क या होम पिकअप:* *${SHOP_PHONE}*`;
  }

  const chunks = [];
  for (let i = 0; i < lines.length; i += MAX_ITEMS_PER_MESSAGE) {
    chunks.push(lines.slice(i, i + MAX_ITEMS_PER_MESSAGE));
  }
  return chunks.map((chunk, idx) => {
    const header = `💰 *${label} — रेट लिस्ट* (${idx + 1}/${chunks.length})`;
    return `${header}\n\n${chunk.join("\n")}\n\n📞 *दुकान पर संपर्क या होम पिकअप:* *${SHOP_PHONE}*`;
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
