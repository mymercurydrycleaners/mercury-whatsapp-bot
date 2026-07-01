const { askGemini } = require("./gemini");
const { createPriceContext } = require("./intent");
const fs = require("fs");
const path = require("path");

const { askGemini } = require("./gemini");
const { createPriceContext } = require("./intent");

const PRICE_DATA = JSON.parse(
    fs.readFileSync(path.join(__dirname, "prices.json"), "utf8")
);

const sessions = new Map();

const SHOP_TIMING =
`🕒 Shop Timing

Monday - Saturday
9:30 AM - 8:30 PM

Sunday
10:00 AM - 8:00 PM`;

const SHOP_LOCATION =
`📍 My Mercury Dry Cleaners

1st Floor,
In front of Shukwari Bazar,
Near Old Pvt Bus Stand,
Gandhi Nagar,
Mahoba - 210427

https://maps.app.goo.gl/xxveghHtvhFcEq65A`;

const SERVICES =
`🧺 Our Services

• Dry Cleaning
• Laundry
• Steam Iron
• Saree
• Lehenga
• Blanket
• Curtain
• Carpet
• Shoes
• Sofa Cover
• Soft Toys

and many more...`;

function getSession(phone){

    if(!sessions.has(phone)){

        sessions.set(phone,{
            history:[]
        });

    }

    return sessions.get(phone);

}

function greeting(){

return `👋 Hello!

I'm *Aisha* 😊

Welcome to *My Mercury Dry Cleaners*.

You can ask me anything about

✅ Prices

✅ Dry Cleaning

✅ Laundry

✅ Stain Removal

✅ Shop Timing

✅ Pickup

✅ Delivery

✅ Order Status

Just type your question naturally.`;

}

async function handleMessage(phone,text){

text=(text||"").trim();

if(text=="")
return [greeting()];

const lower=text.toLowerCase();

if(
lower=="hi"||
lower=="hello"||
lower=="hey"||
lower=="menu"||
lower=="start"
){

return [greeting()];

}

const session=getSession(phone);

const priceContext=createPriceContext(text);

    // -------------------------
    // Price found
    // -------------------------

    if (priceContext !== "") {

        const reply = await askGemini(
            phone,
            text,
            priceContext
        );

        return [reply];
    }

    // -------------------------
    // Timing
    // -------------------------

    if (
        lower.includes("timing") ||
        lower.includes("time") ||
        lower.includes("open") ||
        lower.includes("close") ||
        lower.includes("shop timing") ||
        lower.includes("timings")
    ) {

        return [SHOP_TIMING];

    }

    // -------------------------
    // Location
    // -------------------------

    if (
        lower.includes("location") ||
        lower.includes("address") ||
        lower.includes("map") ||
        lower.includes("shop")
    ) {

        return [SHOP_LOCATION];

    }

    // -------------------------
    // Services
    // -------------------------

    if (
        lower.includes("service") ||
        lower.includes("dry clean") ||
        lower.includes("laundry") ||
        lower.includes("iron") ||
        lower.includes("steam")
    ) {

        return [SERVICES];

    }

    // -------------------------
    // AI Reply
    // -------------------------

    const aiReply = await askGemini(
        phone,
        text
    );

    return [aiReply];

} 
// -------------------------
// Helper Functions
// -------------------------

function saveHistory(phone, userMessage, botReply) {

    const session = getSession(phone);

    session.history.push({
        user: userMessage,
        bot: botReply,
        time: Date.now()
    });

    if (session.history.length > 20) {
        session.history.shift();
    }

}

function resetSession(phone) {

    sessions.delete(phone);

}

function getHistory(phone) {

    const session = getSession(phone);

    return session.history;

}

// -------------------------
// Menu Footer
// -------------------------

function footer() {

    return `

━━━━━━━━━━━━━━━

💬 You can ask me anything 😊

Examples:

• Saree price
• Lehenga price
• Oil stain remove hoga?
• Shop timing
• Delivery available?
• Pickup available?
• Address
• Blanket cleaning

`;

}

// -------------------------
// Export
// -------------------------

module.exports = {
    handleMessage,
    resetSession,
    getHistory,
    saveHistory
};
