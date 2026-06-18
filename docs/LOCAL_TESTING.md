# Local Testing

## Start The App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verify Build

```bash
npm run verify
```

## Run Without OpenAI

Leave `OPENAI_API_KEY` empty or set:

```bash
USE_MOCK_OPENAI=true
```

The app will produce realistic local demo content so the UI, copy buttons, downloads, history, and integration previews can be tested without API calls.

## Run With OpenAI

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
USE_MOCK_OPENAI=false
```

## Test Zapier Route

```bash
curl http://localhost:3000/api/webhooks/zapier
```

```bash
curl -X POST http://localhost:3000/api/webhooks/zapier \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"z-123","first_name":"Taylor","email":"taylor@example.com","source":"Zillow"}'
```

## Test MAXTech/BoldTrail Draft Route

Generate a campaign in the UI, then click **Build preview** in the MAXTech/BoldTrail Draft Preview panel.
