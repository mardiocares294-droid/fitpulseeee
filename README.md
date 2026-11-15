# FITPULSE — NO PAIN, NO GAIN

Deployable FITPULSE web app with a server-side Google Gemini AI Coach. The Gemini API key is read only by the Node server; it is not placed in browser code.

## Publish online with Render

1. Create a GitHub account (if you do not already have one) and create a **new private repository** named `fitpulse`.
2. Upload all files in this folder to the repository's top level. Do not upload a `.env` file or your API key.
3. Open https://render.com and sign in using GitHub.
4. Choose **New → Blueprint** (or **New → Web Service**) and connect the `fitpulse` repository. If using Web Service, use:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
5. In the Render service's **Environment** settings, add:
   - `GEMINI_API_KEY` = your key from https://aistudio.google.com/apikey
   - `GEMINI_MODEL` = `gemini-3.8-flash`
6. Save and deploy. Render will provide an HTTPS address ending in `onrender.com`.
7. Open that public address. Visit `/api/health` on the same domain; it should return `"configured": true` once the key is set.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
# Edit .env and add your Gemini API key
npm start
```

Open http://localhost:3000. Do not open `index.html` directly as a file.

## Important

- Never share your Gemini API key in chat, screenshots, or a public GitHub repository. Enter it only in the host's private Environment settings.
- Gemini API usage may incur charges or be subject to free-tier limits; check Google's current pricing and quotas.
- Render's free web services can sleep after inactivity, so the first visit after a quiet period may take a little longer.
- This is a fitness tracking demo, not a medical device. Tracker values are user-entered and are not verified wearable or medical measurements. Add authentication, stronger abuse controls, privacy disclosures, and a database before collecting real users' sensitive data.
