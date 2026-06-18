# Integration Plan

This app is intentionally draft-only. The current integration layer prepares data for MAXTech/BoldTrail and Zapier without mutating a live CRM.

## Current Local Routes

### Generate Campaign

```http
POST /api/generate
```

Uses OpenAI when `OPENAI_API_KEY` is set. Falls back to local demo generation when the key is missing or `USE_MOCK_OPENAI=true`.

### MAXTech/BoldTrail Draft Preview

```http
POST /api/integrations/maxtech/draft
```

Body:

```json
{
  "values": {},
  "campaign": {}
}
```

Returns the local `Campaign` shape from `lib/maxtech.ts`. No live API call is made.

### Zapier Webhook Example

```http
GET /api/webhooks/zapier
POST /api/webhooks/zapier
```

`POST` maps an inbound Zapier-style payload to the local `Lead` interface. No CRM record is created.

## MAXTech/BoldTrail Work Remaining

Update `lib/maxtech.ts` once the official API details are known:

- Authentication method
- Base URL
- Lead lookup endpoint
- Campaign/template creation endpoint
- Campaign assignment endpoint
- Lead stage update endpoint
- Task creation endpoint
- Rate limit behavior
- Required consent fields for SMS/email automation
- Webhook signature verification, if available

The most important mapping function is:

```ts
buildCampaignDraftFromGeneratedCampaign()
```

Keep that function as the boundary between generated AI content and CRM payloads.

## Campaign Selection Automation

`lib/campaignSelector.ts` contains a deterministic placeholder for future automatic campaign selection.

Current behavior:

- Recommends a campaign template name
- Recommends lead stage
- Assigns priority and confidence
- Suggests CRM tags
- Explains why the rule matched

Future behavior could use:

- MAXTech/BoldTrail lead engagement
- Campaign template IDs
- Lead consent status
- Source-specific response SLAs
- Past transaction data
- Agent availability
- AI ranking after deterministic safety checks

## Zapier Work Remaining

Use a Zapier Catch Hook URL in `ZAPIER_WEBHOOK_URL` for outbound events.

For inbound events, point Zapier to:

```text
https://your-domain.com/api/webhooks/zapier
```

Before production use, add:

- Shared secret or signature verification
- Payload schema validation
- Idempotency checks
- Logging and alerting
- A decision on whether inbound leads should generate drafts automatically or only create review tasks

## Production Safety

Do not add automatic send/schedule behavior without:

- Explicit agent approval
- Message preview
- Consent checks
- Unsubscribe/compliance handling
- Audit logging
- Human override controls
