import { describe, expect, it } from "vitest";
import { sampleCampaignFormValues } from "@/lib/constants";
import { generateMockRealEstateCampaign } from "@/lib/mockCampaign";

describe("generateMockRealEstateCampaign", () => {
  it("returns a structured draft package in mock mode", () => {
    const result = generateMockRealEstateCampaign(sampleCampaignFormValues);

    expect(result.mode).toBe("mock");
    expect(result.parsed).toBe(true);
    expect(result.campaign.facebookPosts).toHaveLength(10);
    expect(result.campaign.instagramPosts).toHaveLength(10);
    expect(result.campaign.sevenDayFollowUpSequence.length).toBeGreaterThan(0);
    expect(result.campaign.reviewReminder.toLowerCase()).toContain("draft");
  });
});
