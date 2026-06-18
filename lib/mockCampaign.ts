import type { CampaignFormValues, GeneratedCampaign, GenerateResponse, SequenceStep } from "./types";

export function generateMockRealEstateCampaign(values: CampaignFormValues): GenerateResponse {
  const leadName = values.leadFirstName || "there";
  const agentName = values.agentName || "your agent";
  const brokerage = values.brokerageName || "my team";
  const market = values.cityMarket || "your market";
  const propertyContext = values.propertyDetails || "the homes you have been looking at";
  const marketContext =
    values.marketNotes ||
    "the market is still moving, but the right next step depends on your timing, budget, and comfort level.";

  const sevenDayFollowUpSequence: SequenceStep[] = [
    {
      day: 0,
      channel: "SMS",
      title: "Fast personal reply",
      message: `Hi ${leadName}, this is ${agentName} with ${brokerage}. I saw your ${values.leadSource} inquiry about ${propertyContext}. Happy to help. Would a quick call today or tomorrow be useful?`
    },
    {
      day: 1,
      channel: "Email",
      title: "Helpful context email",
      message: `Send a short email with 2-3 helpful next steps, a no-pressure call option, and a note that every home should be evaluated on condition, location, and fit.`
    },
    {
      day: 2,
      channel: "Task",
      title: "Create shortlist",
      message: `Review active matches in ${market} and prepare a focused shortlist based on the lead's stated preferences.`
    },
    {
      day: 3,
      channel: "SMS",
      title: "Short check-in",
      message: `Hi ${leadName}, I found a few options that may fit what you asked about. Want me to send the strongest matches?`
    },
    {
      day: 5,
      channel: "Email",
      title: "Market note and invitation",
      message: `Share one practical market observation from ${market}, then invite the lead to choose between a consultation, showing plan, or saved search update.`
    },
    {
      day: 7,
      channel: "Call",
      title: "Personal follow-up",
      message: `Call once, leave a warm voicemail if appropriate, and note whether the lead should stay in active follow-up or move to nurture.`
    }
  ];

  const thirtyDayNurtureSequence: SequenceStep[] = [
    {
      day: 10,
      channel: "Email",
      title: "Buyer or seller roadmap",
      message: `Send a simple roadmap for a ${values.leadType.toLowerCase()} in ${market}, focused on decisions, timing, and avoiding rushed choices.`
    },
    {
      day: 14,
      channel: "SMS",
      title: "Preference refresh",
      message: `Hi ${leadName}, quick question: has anything changed with your timing, budget, or must-haves since you first reached out?`
    },
    {
      day: 18,
      channel: "Task",
      title: "Review engagement",
      message: "Check opens, replies, saved searches, and notes before deciding whether to continue active follow-up."
    },
    {
      day: 21,
      channel: "Email",
      title: "Local market update",
      message: `Share a concise ${market} update with no guarantees, no predictions stated as facts, and one clear invitation to talk.`
    },
    {
      day: 30,
      channel: "Call",
      title: "Monthly check-in",
      message: `Reach out with a helpful tone. If there is no response, keep the lead in a long-term nurture campaign.`
    }
  ];

  const campaign: GeneratedCampaign = {
    immediateFollowUpText: `Hi ${leadName}, this is ${agentName} with ${brokerage}. Thanks for reaching out about ${propertyContext}. I can help you sort through the options in ${market}. Would a quick call today or tomorrow work?`,
    immediateFollowUpEmail: {
      subject: `${leadName}, happy to help with your ${market} search`,
      body: `Hi ${leadName},\n\nThanks for reaching out. I saw your interest in ${propertyContext}, and I would be happy to help you compare options in ${market}.\n\nA good next step is a quick conversation about timing, budget comfort, and what matters most in the home. From there, I can send a focused list instead of overwhelming you with everything online.\n\n${marketContext}\n\nWould you like to set up a quick call today or tomorrow?\n\nBest,\n${agentName}`
    },
    sevenDayFollowUpSequence,
    thirtyDayNurtureSequence,
    monthlyNewsletter: {
      subject: `${market} real estate notes worth watching this month`,
      body: `Hi ${leadName},\n\nThis month's ${market} market is worth watching with a practical lens. Inventory, pricing strategy, and monthly payment comfort all matter, but there is no one-size-fits-all answer.\n\nWhat I am watching:\n- Which homes are sitting long enough for negotiation\n- Which listings are still moving quickly because they are priced well\n- How buyers and sellers are adjusting expectations\n\nIf you are thinking about a move, I can help you understand what the current numbers mean for your specific situation.\n\nBest,\n${agentName}`
    },
    facebookPosts: Array.from({ length: 10 }, (_, index) => ({
      platform: "Facebook",
      caption: `Real estate note ${index + 1} for ${market}: the best move is not always the fastest move. Whether you are buying, selling, or planning ahead, local context matters. If you want a clear read on your options, I am happy to help.`,
      hashtags: [`#${market.replace(/[^a-zA-Z]/g, "")}RealEstate`, "#LocalMarketUpdate"]
    })),
    instagramPosts: Array.from({ length: 10 }, (_, index) => ({
      platform: "Instagram",
      caption: `${market} real estate thought ${index + 1}: a smart plan starts with your timing, your numbers, and the right local context. Save this if a move is on your radar.`,
      hashtags: [`#${market.replace(/[^a-zA-Z]/g, "")}Homes`, "#RealEstateTips", "#HomeSearch"]
    })),
    marketUpdateEmail: {
      subject: `${market} market update: what to watch now`,
      body: `Hi ${leadName},\n\nHere is the short version of what I am watching in ${market}: ${marketContext}\n\nThe right strategy depends on the property, condition, price point, and your goals. If you want, I can walk you through what this means for your next step without any pressure.\n\nBest,\n${agentName}`
    },
    openHousePromotion: {
      subject: `Open house opportunity in ${market}`,
      body: `Hi ${leadName},\n\nI wanted to share an open house opportunity that may be worth a look based on your interest in ${propertyContext}.\n\nBefore you go, it helps to know what to look for beyond the photos: condition, layout, neighborhood fit, comparable sales, and any follow-up questions for the listing side.\n\nIf you want, I can help you evaluate it before or after you visit.\n\nBest,\n${agentName}`
    },
    suggestedMaxTechCampaignStructure: {
      name: `${values.leadSource} ${values.leadType} - ${values.campaignGoal}`,
      audience: `${values.leadStage} leads from ${values.leadSource} in ${market}`,
      trigger: `Manual assignment after reviewing a new ${values.leadSource} inquiry`,
      steps: [...sevenDayFollowUpSequence, ...thirtyDayNurtureSequence],
      notes:
        "Set this up as a draft campaign template in MAXTech/BoldTrail. Review every message, confirm SMS/email consent, and personalize before activation."
    },
    suggestedLeadCategoryStage: values.leadStage === "Cold Lead" ? "Prospect" : values.leadStage,
    suggestedNextTaskForAgent: `Review ${leadName}'s inquiry, prepare 3 relevant talking points, and invite them to a short ${values.campaignGoal.toLowerCase()} conversation.`,
    reviewReminder:
      "Draft only. Review for accuracy, compliance, fair housing, local market context, and communication consent before sending."
  };

  return {
    campaign,
    rawText: JSON.stringify(campaign, null, 2),
    parsed: true,
    mode: "mock",
    notice:
      "Generated in local demo mode because OPENAI_API_KEY is not set or mock mode is enabled. Add OPENAI_API_KEY to use OpenAI."
  };
}
