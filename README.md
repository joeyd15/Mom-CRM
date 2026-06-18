<<<<<<< HEAD
# Mom-CRM
=======
# Real Estate AI Campaign Assistant

A local Next.js MVP for a licensed real estate agent using MAXTech/BoldTrail. It generates draft marketing campaigns, follow-up messages, nurture sequences, newsletters, social posts, and CRM campaign structure suggestions with OpenAI.

The app does not send texts or emails. Everything is draft-only and intended to be reviewed before being copied into MAXTech/BoldTrail.

## Install

```bash
npm install
```

## Add OpenAI API Key

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
USE_MOCK_OPENAI=false
```

See `.env.example` for all supported environment variables.

## Run Locally

```bash
npm run dev
```

Open the local URL printed by Next.js.

For a no-key demo mode, leave `OPENAI_API_KEY` empty or set `USE_MOCK_OPENAI=true`.

## Working Now

- Dashboard form for agent, market, lead, property, and campaign details
- OpenAI-backed campaign generation through `app/api/generate/route.ts`
- Reusable OpenAI service in `lib/openai.ts`
- Real estate-specific system prompt and JSON schema in `lib/prompts.ts`
- Structured campaign output with safe raw-text fallback if JSON parsing fails
- Immediate SMS draft
- Immediate email draft with subject line
- 7-day follow-up sequence
- 30-day nurture sequence
- Monthly newsletter draft
- 10 Facebook post drafts
- 10 Instagram post drafts
- Market update email
- Open house promotion
- Suggested MAXTech/BoldTrail campaign structure
- Suggested lead stage and next task
- Copy-to-clipboard buttons
- Regenerate button
- Load sample and reset buttons
- Local recent-draft history
- Copy-all, Markdown download, and JSON download
- Local MAXTech/BoldTrail draft preview
- Zapier inbound webhook example route
- Loading and error states
- Responsive layout

## Mocked Or Stubbed

- MAXTech/BoldTrail API calls in `lib/maxtech.ts`
- Zapier webhook helpers in `lib/zapier.ts`
- CRM lead lookup, campaign draft creation, campaign assignment, lead stage updates, and task creation
- Local demo generation when no OpenAI key is configured

The MAXTech helpers return mock data when credentials are absent. If `MAXTECH_API_KEY` and `MAXTECH_API_BASE_URL` are present, they currently throw:

```text
Not implemented: MAXTech API credentials required
```

That is intentional until real endpoint details, authentication, payload shape, and rate limits are confirmed.

## Future MAXTech/BoldTrail Integration

When the API details are available, update `lib/maxtech.ts` to:

- Authenticate with the official MAXTech/BoldTrail API
- Map local `Lead`, `Campaign`, `CampaignStep`, and `CRMStage` interfaces to the real API payloads
- Fetch leads by ID
- Create campaign drafts or duplicate templates
- Assign leads to campaigns
- Update lead stages
- Create agent follow-up tasks

Keep the app in draft-only mode unless the agent explicitly approves a send/schedule workflow.

## Zapier And Webhooks

`lib/zapier.ts` includes:

- `sendToZapierWebhook()` for future outbound Zapier Catch Hook workflows
- `receiveLeadWebhookExample()` showing a possible inbound lead payload shape

Later, you can add a route such as `app/api/webhooks/zapier/route.ts` to receive lead events from Zapier, Zillow-connected automations, or MAXTech/BoldTrail workflow triggers.

That route now exists as a mock receiver and mapper.

## More Docs

- `docs/INTEGRATION_PLAN.md`
- `docs/LOCAL_TESTING.md`
>>>>>>> 5e03a7f (Initial Mom CRM platform import)
