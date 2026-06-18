import type { GeneratedCampaign, SequenceStep } from "./types";

export type ComplianceSeverity = "info" | "warning";

export interface ComplianceIssue {
  severity: ComplianceSeverity;
  location: string;
  message: string;
  excerpt?: string;
}

const guaranteePatterns = [
  /\bguarantee(?:d|s)?\b/i,
  /\bwill increase\b/i,
  /\bwill appreciate\b/i,
  /\bcan'?t lose\b/i,
  /\brisk[-\s]?free\b/i,
  /\bno risk\b/i,
  /\bhighest possible price\b/i,
  /\bbest deal\b/i,
  /\bperfect investment\b/i
];

const spamPatterns = [
  /\bact now\b/i,
  /\blimited time\b/i,
  /\bonce in a lifetime\b/i,
  /\bfree money\b/i,
  /\burgent\b/i,
  /\bmust see\b/i
];

export function scanCampaignCompliance(campaign: GeneratedCampaign): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  scanText("Immediate follow-up text", campaign.immediateFollowUpText, issues);
  scanText("Immediate follow-up email", campaign.immediateFollowUpEmail.body, issues);
  scanSequence("7-day follow-up sequence", campaign.sevenDayFollowUpSequence, issues);
  scanSequence("30-day nurture sequence", campaign.thirtyDayNurtureSequence, issues);
  scanText("Monthly newsletter", campaign.monthlyNewsletter.body, issues);
  scanText("Market update email", campaign.marketUpdateEmail.body, issues);
  scanText("Open house promotion", campaign.openHousePromotion.body, issues);

  campaign.facebookPosts.forEach((post, index) => scanText(`Facebook post ${index + 1}`, post.caption, issues));
  campaign.instagramPosts.forEach((post, index) => scanText(`Instagram post ${index + 1}`, post.caption, issues));

  if (campaign.immediateFollowUpText.length > 320) {
    issues.push({
      severity: "warning",
      location: "Immediate follow-up text",
      message: "SMS draft is longer than 320 characters. Consider shortening before sending."
    });
  }

  [...campaign.sevenDayFollowUpSequence, ...campaign.thirtyDayNurtureSequence]
    .filter((step) => step.channel === "SMS")
    .forEach((step) => {
      if (step.message.length > 320) {
        issues.push({
          severity: "warning",
          location: `Day ${step.day} SMS`,
          message: "SMS sequence message is longer than 320 characters. Consider shortening before sending."
        });
      }
    });

  if (issues.length === 0) {
    issues.push({
      severity: "info",
      location: "Local scan",
      message:
        "No obvious guarantee, spam, or long-SMS issues were found by the local scanner. Human review is still required."
    });
  }

  return issues;
}

function scanSequence(location: string, steps: SequenceStep[], issues: ComplianceIssue[]) {
  steps.forEach((step) => scanText(`${location}, day ${step.day}`, step.message, issues));
}

function scanText(location: string, text: string, issues: ComplianceIssue[]) {
  for (const pattern of guaranteePatterns) {
    const match = text.match(pattern);
    if (match) {
      const index = match.index ?? 0;
      if (isNegatedGuaranteeLanguage(text, index)) {
        continue;
      }

      issues.push({
        severity: "warning",
        location,
        message: "Potential guarantee or outcome-promise language found. Review and soften this wording.",
        excerpt: buildExcerpt(text, index)
      });
    }
  }

  for (const pattern of spamPatterns) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        severity: "warning",
        location,
        message: "Potentially spammy or high-pressure language found. Review before using.",
        excerpt: buildExcerpt(text, match.index ?? 0)
      });
    }
  }

  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount >= 3) {
    issues.push({
      severity: "warning",
      location,
      message: "Multiple exclamation points found. Consider a calmer tone."
    });
  }
}

function buildExcerpt(text: string, index: number) {
  const start = Math.max(0, index - 45);
  const end = Math.min(text.length, index + 85);
  return text.slice(start, end).trim();
}

function isNegatedGuaranteeLanguage(text: string, index: number) {
  const prefix = text.slice(Math.max(0, index - 8), index).toLowerCase();
  return /\b(no|without)\s+$/.test(prefix);
}
