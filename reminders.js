// reminders.js
// Smart Auto-Reminder & Customer Enquiry Follow-up System
// for My Mercury Dry Cleaners WhatsApp Bot

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "enquiries.json");
const SHOP_PHONE = "9151517444";
const SHOP_MAPS_URL = "https://maps.app.goo.gl/xxveghHtvhFcEq65A";
const SHOP_ADDRESS_SHORT = "1st Floor, In front of Shukwari Bazar, Mahoba";

let enquiries = [];

// Load existing enquiries from disk on startup
function loadEnquiries() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      enquiries = JSON.parse(data) || [];
    } else {
      enquiries = [];
    }
  } catch (err) {
    console.error("Error loading enquiries.json:", err.message);
    enquiries = [];
  }
}

// Save enquiries to disk
function saveEnquiries() {
  try {
    // Keep only records from last 7 days to keep file lean and fast
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    enquiries = enquiries.filter((e) => new Date(e.createdAt).getTime() > sevenDaysAgo);
    fs.writeFileSync(DATA_FILE, JSON.stringify(enquiries, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving enquiries.json:", err.message);
  }
}

// Get Date components in Asia/Kolkata (IST)
function getISTParts(d) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const map = {};
  formatter.formatToParts(d).forEach((p) => (map[p.type] = p.value));
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10)
  };
}

// Calculate smart follow-up time based on shop hours
function calculateScheduledTime(fromDate) {
  const now = fromDate || new Date();
  const ist = getISTParts(now);
  const currentTotalMinutes = ist.hour * 60 + ist.minute;

  if (currentTotalMinutes >= 18 * 60) {
    // Evening after 6:00 PM -> Schedule tomorrow at 10:00 AM IST
    const tomorrowMs = now.getTime() + 24 * 60 * 60 * 1000;
    const tomIst = getISTParts(new Date(tomorrowMs));
    const m = String(tomIst.month).padStart(2, "0");
    const d = String(tomIst.day).padStart(2, "0");
    return new Date(`${tomIst.year}-${m}-${d}T10:00:00+05:30`);
  } else if (currentTotalMinutes < 9 * 60 + 30) {
    // Early morning before 9:30 AM -> Schedule today at 10:30 AM IST
    const m = String(ist.month).padStart(2, "0");
    const d = String(ist.day).padStart(2, "0");
    return new Date(`${ist.year}-${m}-${d}T10:30:00+05:30`);
  } else {
    // Normal daytime working hours -> 2.5 hours (150 minutes) later
    return new Date(now.getTime() + 150 * 60 * 1000);
  }
}

// Check if shop is currently open / appropriate time to send reminder
function isAppropriateReminderTime() {
  const now = new Date();
  const ist = getISTParts(now);
  const currentTotalMinutes = ist.hour * 60 + ist.minute;
  // Send only between 09:30 AM (570 mins) and 20:30 PM (1230 mins)
  return currentTotalMinutes >= 9 * 60 + 30 && currentTotalMinutes <= 20 * 60 + 30;
}

/**
 * Record a customer's enquiry for intelligent follow-up
 * @param {string} phone Customer phone number
 * @param {string} item Garment or service name inquired
 */
function recordEnquiry(phone, item) {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  const cleanItem = (item || "कपड़ों की ड्राई क्लीनिंग").trim();

  // Check if there is already a recent pending or sent enquiry for this customer today
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const existingIndex = enquiries.findIndex(
    (e) => e.phone === cleanPhone && new Date(e.createdAt).getTime() > oneDayAgo
  );

  const now = new Date();
  const scheduledFor = calculateScheduledTime(now);

  if (existingIndex !== -1) {
    const existing = enquiries[existingIndex];
    // If already sent or resolved, do not re-trigger to avoid spamming
    if (existing.status === "sent" || existing.status === "resolved") {
      return;
    }
    // Update existing pending enquiry with latest item inquired
    existing.item = cleanItem;
    existing.updatedAt = now.toISOString();
    existing.scheduledFor = scheduledFor.toISOString();
    saveEnquiries();
    return;
  }

  // Create new enquiry record
  enquiries.push({
    phone: cleanPhone,
    item: cleanItem,
    createdAt: now.toISOString(),
    scheduledFor: scheduledFor.toISOString(),
    status: "pending",
    reminderSentAt: null
  });

  saveEnquiries();
  console.log(`[Reminder] Recorded enquiry for ${cleanPhone} (${cleanItem}), scheduled for ${scheduledFor.toISOString()}`);
}

/**
 * Mark enquiry as resolved/cancelled (e.g. when customer orders or speaks with manager)
 * @param {string} phone Customer phone number
 */
function resolveEnquiry(phone) {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  let updated = false;

  enquiries.forEach((e) => {
    if (e.phone === cleanPhone && e.status === "pending") {
      e.status = "resolved";
      e.resolvedAt = new Date().toISOString();
      updated = true;
    }
  });

  if (updated) {
    saveEnquiries();
    console.log(`[Reminder] Resolved enquiry for ${cleanPhone}`);
  }
}

/**
 * Generate friendly WhatsApp reminder text
 */
function getReminderMessage(item) {
  const garment = item || "कपड़ों की ड्राई क्लीनिंग";
  return (
    `🙏 नमस्ते! आपने *My Mercury Dry Cleaners*, Mahoba से *${garment}* के बारे में जानकारी ली थी। 😊\n\n` +
    `क्या आप आज कपड़े दुकान पर ला रहे हैं, या आपको कोई अन्य जानकारी चाहिए?\n\n` +
    `📍 *दुकान का पता:*\n${SHOP_ADDRESS_SHORT}\n*(शुक्रवारी बाज़ार के सामने, पुराने प्राइवेट बस स्टैंड के पास)*\n\n` +
    `🗺️ *Google Maps:* ${SHOP_MAPS_URL}\n` +
    `📞 *कॉल / पूछताछ:* ${SHOP_PHONE}\n\n` +
    `हम आपके परिधानों की बेहतरीन सफाई और स्टीम प्रेस के लिए हमेशा तैयार हैं! ✨\n` +
    `— आयशा (Aisha) 😊`
  );
}

/**
 * Process all due pending reminders and send WhatsApp messages
 * @param {Function} sendWhatsAppTextFn Function to send text message (to, text)
 */
async function processPendingReminders(sendWhatsAppTextFn) {
  if (!sendWhatsAppTextFn) return;
  if (!isAppropriateReminderTime()) {
    return; // Don't send during night/early morning
  }

  const now = new Date();
  const nowMs = now.getTime();
  let updated = false;

  for (const e of enquiries) {
    if (e.status !== "pending") continue;

    const createdMs = new Date(e.createdAt).getTime();
    const scheduledMs = new Date(e.scheduledFor).getTime();

    // Check Meta 24-hour limit (don't attempt after 23.5 hours)
    if (nowMs - createdMs > 23.5 * 60 * 60 * 1000) {
      e.status = "expired";
      updated = true;
      continue;
    }

    // Check if scheduled time has arrived
    if (nowMs >= scheduledMs) {
      console.log(`[Reminder] Sending auto-reminder to ${e.phone} for ${e.item}...`);
      try {
        const msg = getReminderMessage(e.item);
        await sendWhatsAppTextFn(e.phone, msg);
        e.status = "sent";
        e.reminderSentAt = now.toISOString();
        updated = true;
        console.log(`[Reminder] Successfully sent auto-reminder to ${e.phone}`);
      } catch (err) {
        console.error(`[Reminder] Failed sending to ${e.phone}:`, err.message);
      }
    }
  }

  if (updated) {
    saveEnquiries();
  }
}

/**
 * Get stats of current enquiries
 */
function getEnquiryStats() {
  const pending = enquiries.filter((e) => e.status === "pending").length;
  const sent = enquiries.filter((e) => e.status === "sent").length;
  const resolved = enquiries.filter((e) => e.status === "resolved").length;
  const total = enquiries.length;
  return { total, pending, sent, resolved };
}

// Initial load
loadEnquiries();

module.exports = {
  recordEnquiry,
  resolveEnquiry,
  processPendingReminders,
  getReminderMessage,
  getEnquiryStats,
  calculateScheduledTime
};
