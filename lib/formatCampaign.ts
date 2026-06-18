import type { CampaignFormValues, GeneratedCampaign, SequenceStep, SocialPost } from "./types";

export function formatCampaignAsMarkdown(campaign: GeneratedCampaign, values?: CampaignFormValues) {
  const context = values
    ? [
        `Agent: ${values.agentName || "Not provided"}`,
        `Brokerage/team: ${values.brokerageName || "Not provided"}`,
        `Market: ${values.cityMarket || "Not provided"}`,
        `Lead: ${values.leadFirstName || "Not provided"}`,
        `Lead type: ${values.leadType}`,
        `Lead source: ${values.leadSource}`,
        `Lead stage: ${values.leadStage}`,
        `Goal: ${values.campaignGoal}`,
        `Tone: ${values.tone}`
      ].join("\n")
    : "Input context not attached.";

  return [
    "# Real Estate AI Campaign Draft",
    "",
    "## Review Reminder",
    campaign.reviewReminder,
    "",
    "## Input Context",
    context,
    "",
    "## Immediate Follow-Up Text",
    campaign.immediateFollowUpText,
    "",
    "## Immediate Follow-Up Email",
    `Subject: ${campaign.immediateFollowUpEmail.subject}`,
    "",
    campaign.immediateFollowUpEmail.body,
    "",
    "## 7-Day Follow-Up Sequence",
    formatSequenceMarkdown(campaign.sevenDayFollowUpSequence),
    "",
    "## 30-Day Nurture Sequence",
    formatSequenceMarkdown(campaign.thirtyDayNurtureSequence),
    "",
    "## Monthly Newsletter",
    `Subject: ${campaign.monthlyNewsletter.subject}`,
    "",
    campaign.monthlyNewsletter.body,
    "",
    "## Facebook Posts",
    formatSocialMarkdown(campaign.facebookPosts),
    "",
    "## Instagram Posts",
    formatSocialMarkdown(campaign.instagramPosts),
    "",
    "## Market Update Email",
    `Subject: ${campaign.marketUpdateEmail.subject}`,
    "",
    campaign.marketUpdateEmail.body,
    "",
    "## Open House Promotion",
    `Subject: ${campaign.openHousePromotion.subject}`,
    "",
    campaign.openHousePromotion.body,
    "",
    "## Suggested MAXTech/BoldTrail Campaign Structure",
    `Name: ${campaign.suggestedMaxTechCampaignStructure.name}`,
    `Audience: ${campaign.suggestedMaxTechCampaignStructure.audience}`,
    `Trigger: ${campaign.suggestedMaxTechCampaignStructure.trigger}`,
    "",
    formatSequenceMarkdown(campaign.suggestedMaxTechCampaignStructure.steps),
    "",
    campaign.suggestedMaxTechCampaignStructure.notes,
    "",
    "## CRM Recommendation",
    `Suggested lead category/stage: ${campaign.suggestedLeadCategoryStage}`,
    `Suggested next task: ${campaign.suggestedNextTaskForAgent}`
  ].join("\n");
}

export function downloadTextFile(filename: string, text: string, mimeType = "text/plain") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildCampaignFilename(values?: CampaignFormValues, extension = "md") {
  const market = slugify(values?.cityMarket || "campaign");
  const lead = slugify(values?.leadFirstName || "lead");
  const date = new Date().toISOString().slice(0, 10);

  return `${date}-${market}-${lead}-campaign.${extension}`;
}

function formatSequenceMarkdown(steps: SequenceStep[]) {
  if (!steps.length) {
    return "_No sequence steps generated._";
  }

  return steps
    .map((step) => `### Day ${step.day}: ${step.title}\nChannel: ${step.channel}\n\n${step.message}`)
    .join("\n\n");
}

function formatSocialMarkdown(posts: SocialPost[]) {
  if (!posts.length) {
    return "_No social posts generated._";
  }

  return posts
    .map((post, index) => {
      const hashtags = post.hashtags?.length ? `\n\n${post.hashtags.join(" ")}` : "";
      return `### ${post.platform} Post ${index + 1}\n${post.caption}${hashtags}`;
    })
    .join("\n\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}
