const fs = require("fs");
const path = require("path");
const fuzz = require("fuzzball");

const PRICE_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "prices.json"), "utf8")
);

const CATEGORIES = Object.keys(PRICE_DATA);

// Find ALL relevant matches
function findPrice(query) {
  const q = query.toLowerCase().trim();

  if (q.length < 2) return [];

  const results = [];

  for (const category of CATEGORIES) {
    for (const item of PRICE_DATA[category]) {
      const garment = item.garment.toLowerCase();

      const score = fuzz.token_set_ratio(q, garment);

      // direct match
      if (garment.includes(q)) {
        results.push({
          garment: item.garment,
          price: item.price,
          category,
          score: 100,
        });
        continue;
      }

      // fuzzy match
      if (score >= 65) {
        results.push({
          garment: item.garment,
          price: item.price,
          category,
          score,
        });
      }
    }
  }

  // Highest score first
  results.sort((a, b) => b.score - a.score);

  // Remove duplicate garments
  const unique = [];
  const used = new Set();

  for (const item of results) {
    const key = item.garment.toLowerCase();

    if (!used.has(key)) {
      used.add(key);
      unique.push(item);
    }
  }

  return unique.slice(0, 95);
}

function createPriceContext(userMessage) {
  const matches = findPrice(userMessage);

  if (matches.length === 0) return "";

  let context = `
Customer asked about:

${userMessage}

Matching Price List:

`;

  for (const item of matches) {
    context += `• ${item.garment} (${item.category}) : ${
      item.price > 0 ? "₹" + item.price : "Contact Shop"
    }\n`;
  }

  context += `

Instructions:

- Use ONLY the prices above.
- If multiple variants exist, show ALL of them.
- Never invent a price.
- If customer is unsure, ask which variant they have.
`;

  return context;
}

module.exports = {
  findPrice,
  createPriceContext,
};
