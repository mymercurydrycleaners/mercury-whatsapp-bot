// conversation.js
// Inquiry-only bot for My Mercury Dry Cleaners.
// This bot does NOT take pickup/drop bookings — that is handled by a
// separate app. This bot only answers customer questions about:
//   1. Shop timing
//   2. Location
//   3. Services
//   4. Price list (browse by category OR search by garment name)
//   5. Order status (manual/placeholder for now)
//
// State is stored in-memory (per phone number). For a small single-location
// business this is fine; swap this Map for a real database later if needed.

const fs = require("fs");
const path = require("path");

const sessions = new Map(); // key: customer phone number, value: session object

// ---------------------------------------------------------------------
// EDIT THESE — placeholder business details. Update with real info.
// ---------------------------------------------------------------------
const SHOP_TIMING =
  "🕒 *Shop Timing*\nMonday - Saturday: 9:30 AM - 8:30 PM\nSunday: 10:00 AM - 8:00 PM";

const SHOP_LOCATION =
  "📍 *Our Location*\nMy Mercury Dry Cleaners\n[1st floor, Infornt of shukwari bazar]\n[Near old Pvt Bus Stand, Gandhi nagar]\n[Mahoba - Pincode-210427]\n\nGoogle Maps: [https://maps.app.goo.gl/xxveghHtvhFcEq65A]";

// Image shown below the location text. Served as a static file by index.js
// from the /assets folder (see index.js for PUBLIC_BASE_URL config).
const LOCATION_IMAGE = { type: "image", path: "/assets/location-banner.png" };

const SERVICES_TEXT =
  "🧺 *Our Services*\n\n• Dry Cleaning\n• Laundry\n• Steam Iron\n\nReply *4* to see our full price list.";

// Load the full Dry Cleaning price list (category -> [{garment, price}])
const PRICE_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "prices.json"), "utf-8")
);
const CATEGORY_KEYS = Object.keys(PRICE_DATA); // ["Men","Women","Kids","Household","Institutional","Others"]

// Placeholder order status lookup. Replace this with a real database/API
// call later (e.g. to your pickup/drop app's backend) so each order number
// returns its real status automatically.
const ORDER_STATUS_LOOKUP = {
  // "ORD1001": "Ready for pickup",
  // "ORD1002": "In progress - ironing stage",
};
const DEFAULT_ORDER_STATUS_MESSAGE =
  "We've received your order number. Our team will check the latest status and update you shortly.";

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, { step: "menu" });
  }
  return sessions.get(phone);
}

function resetSession(phone) {
  sessions.set(phone, { step: "menu" });
}

/**
 * Given the incoming text message and the customer's phone number,
 * decide what the bot should reply with. Returns an array of message
 * strings to send in order.
 */
function handleMessage(phone, rawText) {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();
  const session = getSession(phone);

  // Global commands available at any step
  if (["hi", "hello", "hey", "start", "menu"].includes(lower)) {
    resetSession(phone);
    return greetingAndMenu();
  }

  switch (session.step) {
    case "menu": {
      switch (text) {
        case "1":
          return [SHOP_TIMING, ...menuFooter()];
        case "2":
          return [SHOP_LOCATION, LOCATION_IMAGE, ...menuFooter()];
        case "3":
          return [SERVICES_TEXT, ...menuFooter()];
        case "4":
          session.step = "price_menu";
          return [priceCategoryMenuText()];
        case "5":
          session.step = "awaiting_order_number";
          return ["Please type your *order number* so we can check its status."];
        default: {
          // Not a menu number — try treating it as a garment name search
          // from anywhere in the main menu (so customers can just type
          // "saree" without navigating through option 4 first).
          const matches = searchGarment(text);
          if (matches.length > 0) {
            return [formatMatches(matches), ...menuFooter()];
          }
          return [
            "Sorry, I didn't understand that. Please reply with a number from the menu below, or type a garment name (e.g. \"saree\") to check its price:",
            ...greetingAndMenu()
          ];
        }
      }
    }

    case "price_menu": {
      // Numbered category choice
      const categoryIndex = parseInt(text, 10);
      if (
        !isNaN(categoryIndex) &&
        categoryIndex >= 1 &&
        categoryIndex <= CATEGORY_KEYS.length
      ) {
        const category = CATEGORY_KEYS[categoryIndex - 1];
        session.step = "menu"; // back to main menu after showing list
        const listResult = categoryPriceListText(category);
        const listMessages = Array.isArray(listResult) ? listResult : [listResult];
        return [...listMessages, ...menuFooter()];
      }

      // Otherwise treat the input as a garment name search
      const matches = searchGarment(text);
      if (matches.length > 0) {
        session.step = "menu";
        return [formatMatches(matches), ...menuFooter()];
      }

      return [
        "Sorry, I couldn't find that. Reply with a category number (1-" +
          CATEGORY_KEYS.length +
          ") or type a garment name (e.g. \"shirt\", \"saree\", \"blanket\")."
      ];
    }

    case "awaiting_order_number": {
      const orderNumber = text.toUpperCase();
      const status = ORDER_STATUS_LOOKUP[orderNumber] || DEFAULT_ORDER_STATUS_MESSAGE;
      resetSession(phone);
      return [
        `📦 *Order ${orderNumber}*\nStatus: ${status}`,
        ...menuFooter()
      ];
    }

    default: {
      resetSession(phone);
      return greetingAndMenu();
    }
  }
}

// ---------------------------------------------------------------------
// Price search helpers
// ---------------------------------------------------------------------

/**
 * Case-insensitive partial match search across all garments in all
 * categories. Returns an array of {category, garment, price} matches
 * (capped to avoid flooding the chat with too many results).
 */
function searchGarment(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results = [];
  for (const category of CATEGORY_KEYS) {
    for (const item of PRICE_DATA[category]) {
      if (item.garment.toLowerCase().includes(q)) {
        results.push({ category, garment: item.garment, price: item.price });
      }
    }
  }
  return results.slice(0, 10); // cap results
}

function formatMatches(matches) {
  if (matches.length === 1) {
    const m = matches[0];
    return formatPriceLine(m.category, m.garment, m.price);
  }
  let text = `💰 Found ${matches.length} matching item(s):\n\n`;
  matches.forEach((m) => {
    text += formatPriceLine(m.category, m.garment, m.price) + "\n";
  });
  return text.trim();
}

function formatPriceLine(category, garment, price) {
  if (!price || price === 0) {
    return `*${garment}* (${category}): Please contact us for pricing.`;
  }
  return `*${garment}* (${category}): ₹${price}`;
}

function priceCategoryMenuText() {
  let text = "💰 *Price List — Dry Cleaning*\n\nChoose a category by number:\n\n";
  CATEGORY_KEYS.forEach((cat, i) => {
    text += `${i + 1}️⃣ ${cat}\n`;
  });
  text += "\nOr just type a garment name directly (e.g. \"saree\", \"blazer\", \"blanket\") to search.";
  return text;
}

function categoryPriceListText(category) {
  const items = PRICE_DATA[category];
  const MAX_ITEMS_PER_MESSAGE = 30;
  const lines = items.map((item) => {
    const priceText = item.price && item.price > 0 ? `₹${item.price}` : "Contact us";
    return `${item.garment}: ${priceText}`;
  });

  // If short enough, return as a single message.
  if (lines.length <= MAX_ITEMS_PER_MESSAGE) {
    return `💰 *${category} — Dry Cleaning Prices*\n\n${lines.join("\n")}`;
  }

  // Otherwise split into multiple messages so WhatsApp doesn't choke on
  // one giant block of text.
  const chunks = [];
  for (let i = 0; i < lines.length; i += MAX_ITEMS_PER_MESSAGE) {
    chunks.push(lines.slice(i, i + MAX_ITEMS_PER_MESSAGE));
  }
  return chunks.map((chunk, idx) => {
    const header = `💰 *${category} — Dry Cleaning Prices* (${idx + 1}/${chunks.length})`;
    return `${header}\n\n${chunk.join("\n")}`;
  });
}

// ---------------------------------------------------------------------
// Menu text helpers
// ---------------------------------------------------------------------

function menuFooter() {
  return ["Type *Menu* anytime to see all options again. — Aisha 😊"];
}

function greetingAndMenu() {
  return [
    "👋 Hi! I'm *Aisha*, your assistant at *My Mercury Dry Cleaners* (Since 1980).\n" +
    "How can I help you today? Please reply with a number:\n\n" +
    "1️⃣ Shop Timing\n" +
    "2️⃣ Location\n" +
    "3️⃣ Our Services\n" +
    "4️⃣ Pricing\n" +
    "5️⃣ Check Order Status\n\n" +
    "Tip: You can also just type a garment name (e.g. \"saree\") anytime to check its price.\n\n" +
    "(To book a pickup/drop, please use our app.)"
  ];
}

module.exports = { handleMessage };
