# My Mercury Dry Cleaners — WhatsApp Inquiry Bot

A simple WhatsApp Business bot built on Meta's official WhatsApp Cloud API.

**This bot is for inquiries only** — it does NOT take pickup/drop bookings
(that's handled by your separate pickup/drop app). It answers:

1. Shop Timing
2. Location
3. Our Services
4. Pricing — browse by category (Men/Women/Kids/Household/Institutional/Others)
   or type any garment name directly (e.g. "saree", "blazer") to search the
   full price list
5. Order Status (manual lookup — see below)

No third-party WhatsApp platform (Wati/AiSensy/Zoko etc.) is used — this is
your own code, running on your own server, talking directly to Meta's API.


---

## 1. What you need before deploying

From your Meta App Dashboard → WhatsApp → API Setup, copy:

1. **Temporary access token** (or generate a permanent one later)
2. **Phone number ID** (for the WhatsApp number you added/will add)
3. Pick your own **Verify Token** — any random string you choose, e.g. `mercury_verify_2026`

---

## 2. Deploy for FREE on Render.com

1. Go to https://render.com and sign up (free, no credit card needed for the free tier).
2. Click **New +** → **Web Service**.
3. Connect this code:
   - Easiest: push this folder to a new GitHub repo, then connect that repo to Render.
   - Alternative: Render also supports uploading a zip in some flows — GitHub is the most reliable.
4. Render will detect Node.js automatically. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   - `WHATSAPP_TOKEN` = (your token from Meta)
   - `WHATSAPP_PHONE_NUMBER_ID` = (your phone number ID from Meta)
   - `VERIFY_TOKEN` = `mercury_verify_2026` (or whatever you picked)
6. Click **Create Web Service**. Wait for the build to finish (2-3 minutes).
7. Render will give you a public URL like:
   `https://mercury-dry-cleaners-bot.onrender.com`

---

## 3. Connect the webhook to Meta

1. In Meta App Dashboard → WhatsApp → Configuration.
2. Set **Callback URL** to: `https://YOUR-RENDER-URL.onrender.com/webhook`
3. Set **Verify Token** to the exact same value you used in step 2.5 above.
4. Click **Verify and Save**. (If this fails, double check the verify token matches exactly,
   and that your Render service is "Live" — not still building.)
5. Under **Webhook fields**, subscribe to `messages`.

---

## 4. Test it

From your personal phone, send "Hi" to your WhatsApp Business test number.
You should get the welcome menu back within a few seconds. Walk through each
menu option (1-5) to see Shop Timing, Location, Services, Pricing, and Order
Status — this is exactly the flow to record for your App Review screencast.

---

## 5. Updating Shop Timing, Location, Prices, and Order Status

Open `conversation.js` and edit these sections directly:

- **Shop Timing / Location**: edit the `SHOP_TIMING` and `SHOP_LOCATION`
  constants near the top of the file with your real details.
- **Prices**: edit `prices.json` directly — it's a simple structure:
  ```json
  {
    "Men": [
      { "garment": "Shirt", "price": 30 },
      { "garment": "Blazer", "price": 180 }
    ],
    "Women": [ ... ]
  }
  ```
  Add, remove, or update entries here any time. A price of `0` will show
  as "Contact us" to customers instead of ₹0. Redeploy after editing
  (push to GitHub — Render auto-redeploys).
- **Order Status**: add entries to the `ORDER_STATUS_LOOKUP` object, e.g.:

  ```js
  const ORDER_STATUS_LOOKUP = {
    "ORD1001": "Ready for pickup",
    "ORD1002": "In progress - ironing stage",
  };
  ```

  Any order number NOT listed here will get the default "we'll check and
  update you" message. Whenever you update this list, you'll need to
  redeploy (on Render: push the change to GitHub, it auto-redeploys).

  Later, if you want this to be fully automatic, this lookup can be replaced
  with a real API call to your pickup/drop app's backend/database instead of
  manually editing this file each time.


---

## 5. Notes on data handling (for App Review form)

- This bot does **not** use any third-party WhatsApp platform/processor.
  All customer messages are received and replied to directly via Meta's
  WhatsApp Cloud API, processed by code you own, running on your own
  Render server.
- Customer phone numbers and messages are kept only in memory during the
  conversation (no database) — nothing is permanently stored unless you
  add that yourself later.
- If you later add a database, payment processor, or SMS provider, update
  your Privacy Policy and the "Data handling" section of App Review
  accordingly, since that would introduce a real data processor.

---

## 6. Customizing later

- Edit `conversation.js` to change menu text, pricing, or add more steps
  (e.g. asking for preferred pickup time slot).
- Edit `index.js` only if you need to change how messages are sent/received
  (e.g. to support images, buttons, or list messages instead of plain text).
