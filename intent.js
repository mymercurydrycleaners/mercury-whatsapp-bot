// intent.js

const fs = require("fs");
const path = require("path");
const fuzz = require("fuzzball");

const PRICE_DATA = JSON.parse(
    fs.readFileSync(path.join(__dirname, "prices.json"), "utf8")
);

const CATEGORYS = Object.keys(PRICE_DATA);

function findPrice(userMessage) {

    const query = userMessage.toLowerCase().trim();

    let best = null;
    let bestScore = 0;

    for (const category of CATEGORYS) {

        for (const item of PRICE_DATA[category]) {

            const garment = item.garment.toLowerCase();

            const score = fuzz.token_set_ratio(query, garment);

            if (score > bestScore) {

                bestScore = score;

                best = {
                    category,
                    garment: item.garment,
                    price: item.price,
                    score
                };

            }

        }

    }

    if (bestScore < 60)
        return null;

    return best;

}

function createPriceContext(userMessage){

    const result = findPrice(userMessage);

    if(!result)
        return "";

    if(result.price==0){

        return `
Customer is asking about:

${result.garment}

Category:

${result.category}

Price is unavailable.

Tell customer politely to contact the shop or send photo.
`;

    }

    return `
Customer is asking about

${result.garment}

Category

${result.category}

Price

₹${result.price}

Use this exact price.

Never change it.
`;

}

module.exports={
    findPrice,
    createPriceContext
};
