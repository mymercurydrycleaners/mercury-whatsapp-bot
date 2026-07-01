// gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const KNOWLEDGE = require("./knowledge");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

// Memory (per customer)
const memory = new Map();

async function askGemini(phone, customerMessage, extraContext = "") {

    let history = memory.get(phone) || [];

    const prompt = `
${KNOWLEDGE}

==============================
EXTRA CONTEXT
==============================

${extraContext}

==============================
CONVERSATION HISTORY
==============================

${history.join("\n")}

==============================
CUSTOMER MESSAGE
==============================

${customerMessage}

==============================
YOUR TASK
==============================

Reply naturally.

If the customer asks about price,
use the provided context.

If the price is unavailable,
ask for a photo.

Never invent prices.

Reply in the same language used by the customer.

If customer speaks Hindi,
reply in Hindi.

If customer speaks English,
reply in English.

If customer speaks Hinglish,
reply in Hinglish.

Keep reply under 100 words.
`;

    try {

        const result = await model.generateContent(prompt);

        const response = result.response.text().trim();

        history.push("Customer: " + customerMessage);
        history.push("Aisha: " + response);

        if (history.length > 20)
            history = history.slice(-20);

        memory.set(phone, history);

        return response;

    } catch (err) {

        console.error(err);

        return "🙏 Sorry, I'm having trouble answering right now. Please try again in a moment.";

    }

}

module.exports = {
    askGemini
};
