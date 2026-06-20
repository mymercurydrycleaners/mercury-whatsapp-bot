# Mercury Dry Cleaners — WhatsApp AI Auto-Reply Bot

Yeh bot customer ke WhatsApp messages ko **Google Gemini AI** se padhega aur **automatically reply** karega — bina aapko kuch type kiye.

---

## Kaise kaam karta hai (overview)

```
Customer WhatsApp pe message bhejta hai
        ↓
Meta WhatsApp API → aapka backend server (webhook)
        ↓
Backend Gemini AI ko message bhejta hai
        ↓
Gemini reply generate karta hai (shop ki info ke hisaab se)
        ↓
Backend wapas WhatsApp API se customer ko reply bhejta hai
```

---

## STEP 1: Google Gemini API key lo (FREE, 2 minute)

1. Jao: **https://aistudio.google.com/apikey**
2. Google account se login karo
3. **"Create API Key"** click karo
4. Key copy karke safe jagah save karo — yeh `GEMINI_API_KEY` hai

✅ Free tier: 1,500 requests/day, koi credit card nahi chahiye.

---

## STEP 2: WhatsApp ka permanent token aur Phone Number ID lo

Aapne pehle Meta App Dashboard me yeh dekha tha:
- **API Setup** page se: `Phone Number ID` already mil gaya tha (jaise `1113606678510573`)
- **Permanent token** banane ke liye: App Dashboard → **Configuration** tab → "Permanent token" section → **"Learn how to create a permanent token"** link follow karo (System User banake token generate karna hota hai — agar atak jao to mujhe batao, main step-by-step karwa dunga)

Yeh do values note kar lo:
- `WHATSAPP_TOKEN` (permanent token)
- `PHONE_NUMBER_ID`

---

## STEP 3: Code GitHub par upload karo

1. Naya GitHub repo banao: `mercury-whatsapp-bot` (jaisa pehle `mercury-dry-cleaners` banaya tha)
2. Is folder ki saari files upload karo:
   - `server.js`
   - `package.json`
   - `.gitignore`
   - `.env.example`
   - (`.env` file mat upload karna agar bana lo — usme secret keys hoti hain)

---

## STEP 4: Render.com par FREE deploy karo

1. Jao **https://render.com** → GitHub se sign up karo (free)
2. Dashboard me **"New +"** → **"Web Service"** click karo
3. Apna `mercury-whatsapp-bot` repo select karo
4. Settings yeh rakho:
   - **Name**: `mercury-whatsapp-bot`
   - **Region**: jo nearest ho (Singapore agar India ke liye)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. **"Environment Variables"** section me yeh 4 add karo:

   | Key | Value |
   |---|---|
   | `VERIFY_TOKEN` | `mercury123` (ya jo bhi chaho, khud decide karo) |
   | `WHATSAPP_TOKEN` | Step 2 wala permanent token |
   | `PHONE_NUMBER_ID` | Step 2 wala Phone Number ID |
   | `GEMINI_API_KEY` | Step 1 wali key |

6. **"Create Web Service"** click karo

2-3 minute me deploy ho jayega. Aapko ek URL milega jaisa:
```
https://mercury-whatsapp-bot.onrender.com
```

⚠️ **Free tier note**: Render ka free tier 15 minute inactivity ke baad server "sleep" kar deta hai, aur next message aane par 30-50 second me wake hota hai. Pehla reply thoda slow aa sakta hai uske baad normal speed.

---

## STEP 5: Meta App Dashboard me Webhook connect karo

1. Meta App Dashboard → **Connect on WhatsApp** → **Configuration** tab
2. **Callback URL** field me daalo:
   ```
   https://mercury-whatsapp-bot.onrender.com/webhook
   ```
3. **Verify token** field me wahi daalo jo Render me `VERIFY_TOKEN` rakha tha (e.g. `mercury123`)
4. **"Verify and save"** click karo — agar sab sahi hai to green tick aayega

5. Thoda neeche, **"Webhook fields"** me subscribe karo:
   - `messages` ✅ (yeh zaroor on karo)

---

## STEP 6: Test karo!

Apne WhatsApp se us business number par message bhejo (jo aapne connect kiya tha). Bot ko Gemini AI se reply karna chahiye, jaise:

> **Aap:** "Suit dry clean karna hai, kal pickup ho sakta hai?"
> **Bot:** "Bilkul! Aap apna naam, address aur kitne suits hain bata dijiye, hum kal pickup arrange kar denge."

---

## Business info update karna (jaise pricing, naye services)

`server.js` file me **`BUSINESS_CONTEXT`** variable ke andar saari shop info likhi hai. Usko edit karke GitHub par re-upload (commit) karo — Render automatically naya version deploy kar dega.

---

## Important Limits (Free Tier)

- **Gemini**: 1,500 messages/day free — chhoti dukaan ke liye kaafi hai
- **Render**: Free tier sleep karta hai inactivity pe, first message thoda slow aayega
- **WhatsApp**: Free tier messaging limits Meta ki policy ke hisaab se hote hain — zyada volume pe paid tier chahiye hoga (Meta dashboard me "About pricing" link se details milengi)

---

## Agar kuch atak jaye

Common issues:
- **Webhook verify fail ho raha hai** → `VERIFY_TOKEN` Render aur Meta dashboard dono jagah EXACTLY same hona chahiye
- **Bot reply nahi kar raha** → Render dashboard ke "Logs" tab me error check karo
- **"Invalid token" error** → `WHATSAPP_TOKEN` expire ho gaya hoga agar temporary token use kiya tha — permanent token banana zaroori hai
